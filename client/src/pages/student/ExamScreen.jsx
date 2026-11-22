import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import SecurePdfViewer from '../../components/SecurePdfViewer';
import FullscreenGuard from '../../components/FullscreenGuard';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  Lock,
  Send,
  HelpCircle,
  FileCheck,
  Radio,
  Eye,
  Info
} from 'lucide-react';

export default function ExamScreen({ examId }) {
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Security & Telemetry State
  const [violationsCount, setViolationsCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [recentViolationToast, setRecentViolationToast] = useState(null);

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Reset Appeal State (for locked exam)
  const [resetReason, setResetReason] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const lastEventTimeRef = useRef(0);

  // 1. Report Security Event to Server
  const reportSecurityEvent = useCallback(async (eventType, details) => {
    const now = Date.now();
    if (now - lastEventTimeRef.current < 1500) return;
    lastEventTimeRef.current = now;

    try {
      const res = await api.post('/telemetry/security-event', {
        examId,
        sessionToken,
        eventType,
        details
      });

      if (res.violationsCount !== undefined) {
        setViolationsCount(res.violationsCount);
      }
      if (res.locked) {
        setIsLocked(true);
        setLockMessage(res.message || 'Exam locked due to security policy violations.');
      }

      setRecentViolationToast({
        type: eventType,
        details,
        time: new Date().toLocaleTimeString()
      });

      setTimeout(() => {
        setRecentViolationToast(null);
      }, 5000);
    } catch (err) {
      console.warn('Telemetry transmission error:', err);
    }
  }, [examId, sessionToken]);

  // 2. Initialize Exam Session
  useEffect(() => {
    let isMounted = true;
    const startSession = async () => {
      try {
        setLoading(true);
        const data = await api.post('/sessions/start', {
          examId,
          clientSessionToken: sessionStorage.getItem(`exam_token_${examId}`)
        });

        if (isMounted) {
          setExam(data.exam);
          setSessionToken(data.sessionToken);
          setSessionId(data.sessionId);
          setViolationsCount(data.violationsCount || 0);
          setMaxViolations(data.exam?.max_violations || 3);
          sessionStorage.setItem(`exam_token_${examId}`, data.sessionToken);

          if (data.exam?.duration_minutes) {
            setRemainingSeconds(data.exam.duration_minutes * 60);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to initialize secure exam session');
          setLoading(false);
        }
      }
    };

    startSession();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  // 3. Heartbeat Transmission
  useEffect(() => {
    if (!sessionId || isLocked) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.post(`/sessions/${sessionId}/heartbeat`, {
          sessionToken,
          fullscreen: !!document.fullscreenElement
        });
        if (res.locked) {
          setIsLocked(true);
          setLockMessage(res.message);
        }
      } catch (err) {
        console.warn('Heartbeat transmission warning:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, sessionToken, isLocked]);

  // 4. Client-side Focus Loss & Tab Blur Guard
  useEffect(() => {
    if (isLocked) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
      reportSecurityEvent('WINDOW_BLUR', 'Candidate navigated away or minimized exam window');
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        reportSecurityEvent('TAB_SWITCH_ATTEMPT', 'Candidate switched to alternate browser tab');
      } else {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, reportSecurityEvent]);

  // 5. Global Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || isLocked) return;
    if (remainingSeconds <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isLocked]);

  // Fullscreen Exit Event
  const handleFullscreenExit = () => {
    reportSecurityEvent('FULLSCREEN_EXIT', 'Candidate departed forced fullscreen environment');
  };

  // Submit Final Exam
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/sessions/${sessionId}/submit`, { sessionToken });
      sessionStorage.removeItem(`exam_token_${examId}`);
      window.location.hash = '#/completed';
    } catch (err) {
      alert(err.message || 'Error recording final submission');
      setSubmitting(false);
    }
  };

  // Lockout Appeal
  const handleSendResetAppeal = async (e) => {
    e.preventDefault();
    if (!resetReason.trim()) return;
    try {
      await api.post('/sessions/request-reset', {
        examId,
        reason: resetReason.trim()
      });
      setResetSubmitted(true);
    } catch (err) {
      alert(err.message || 'Failed to submit reset appeal');
    }
  };

  const formatTimer = (secs) => {
    if (secs === null || secs === undefined) return '--:--:--';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold tracking-tight">Initializing Examination Cockpit...</h2>
        <p className="text-slate-400 text-xs mt-1">
          Verifying Single-Device Lock & Syncing Anti-Malpractice Telemetry
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full exam-card p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs text-rose-600 mb-6">{error}</p>
          <a
            href="#/student"
            className="inline-block py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Return to Candidate Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Session LOCKED View
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full exam-card p-8 text-center shadow-2xl border-rose-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-1">
            EXAMINATION SESSION SUSPENDED
          </h2>
          <p className="text-xs font-mono text-rose-600 uppercase tracking-wider mb-4 font-bold">
            Malpractice Strike Limit Reached ({violationsCount} / {maxViolations} Strikes)
          </p>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {lockMessage || 'Your examination session has been suspended by the automated proctor due to repeated tab switching, window blur, or fullscreen departures.'}
          </p>

          {resetSubmitted ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center font-medium">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <p className="font-bold text-slate-900 text-sm">Appeal Under Review</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Your incident appeal is currently queued in the invigilator desk. Please wait for authorization.
              </p>
              <a
                href="#/student"
                className="mt-4 inline-block py-2 px-5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Return to Dashboard
              </a>
            </div>
          ) : (
            <form onSubmit={handleSendResetAppeal} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State Your Appeal for Re-entry
                </label>
                <textarea
                  required
                  rows={3}
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Explain why your window lost focus or session was interrupted..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href="#/student"
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  Exit to Portal
                </a>
                <button
                  type="submit"
                  disabled={!resetReason.trim()}
                  className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  Transmit Appeal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <FullscreenGuard isExamActive={true} onFullscreenExit={handleFullscreenExit}>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col select-none relative overflow-hidden">
        {/* Anti-Screen Peek Blur Mask */}
        {isWindowBlurred && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-xl">
              <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Visual Shield Activated: Window Unfocused
            </h3>
            <p className="text-xs text-slate-200 max-w-md mb-4 leading-relaxed">
              You navigated away from the exam tab. Question paper view is masked to prevent external assistance or screenshot leakage.
            </p>
            <div className="px-4 py-2 rounded-xl bg-white text-slate-800 font-mono text-xs font-bold shadow-md">
              Violations: {violationsCount} of {maxViolations} Permitted Strikes
            </div>
            <p className="text-[11px] text-slate-300 mt-4">
              Click anywhere on this screen to restore focus.
            </p>
          </div>
        )}

        {/* Floating Security Violation Alert Toast */}
        {recentViolationToast && (
          <div className="fixed top-20 right-6 z-40 max-w-sm w-full bg-white border border-rose-200 rounded-2xl p-4 shadow-xl animate-bounce">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Security Strike Recorded
                </p>
                <p className="text-xs text-rose-600 mt-0.5">
                  {recentViolationToast.details}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{recentViolationToast.time}</span>
                  <span className="text-amber-600 font-bold">
                    Strikes: {violationsCount} / {maxViolations}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Examination Control Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20 shadow-xs">
          {/* Left: Exam Details */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                  {exam?.exam_code}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-[180px] sm:max-w-md">
                  {exam?.title}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Candidate: <strong className="text-slate-700">{user?.register_number}</strong> ({user?.name})
              </p>
            </div>
          </div>

          {/* Right: Countdown Clock, Telemetry Pill, Finish Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold tracking-wider ${
                remainingSeconds !== null && remainingSeconds < 300
                  ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Strike Indicator Capsule */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <span className="text-slate-400">Strikes:</span>
              <span className={`font-bold ${violationsCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {violationsCount}/{maxViolations}
              </span>
            </div>

            {/* Finish & Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Submit Paper</span>
            </button>
          </div>
        </header>

        {/* Main Body: Custom Secure PDF Canvas Viewer */}
        <div className="flex-1 p-3 sm:p-5 overflow-hidden flex flex-col">
          <SecurePdfViewer
            examId={examId}
            studentRegisterNumber={user?.register_number}
            examCode={exam?.exam_code}
            studentName={user?.name}
            onViolation={(type, details) => reportSecurityEvent(type, details)}
          />
        </div>

        {/* Submit Confirmation Dialog */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full exam-card p-7 shadow-2xl relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
                Finalize & Submit Exam?
              </h3>
              <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                Are you ready to submit your paper? Once confirmed, your responses are finalized and question paper access will be sealed immediately.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Keep Reviewing
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FullscreenGuard>
  );
}
