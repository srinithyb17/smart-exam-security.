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

  // 3. Heartbeat Loop (every 15s)
  useEffect(() => {
    if (!sessionToken || isLocked) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.post('/sessions/heartbeat', {
          examId,
          sessionToken
        });

        if (res.locked) {
          setIsLocked(true);
          setLockMessage(res.message || 'Exam session locked.');
        } else if (res.submitted || res.expired) {
          window.location.hash = '#/completed';
        } else if (res.remainingSeconds !== undefined) {
          setRemainingSeconds(res.remainingSeconds);
        }
      } catch (err) {
        console.warn('Heartbeat telemetry missed:', err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [examId, sessionToken, isLocked]);

  // 4. Timer Countdown (every 1s)
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || isLocked) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isLocked]);

  // 5. Malpractice Event Listeners (Tab Switch, Window Blur, DevTools, Screenshot)
  useEffect(() => {
    if (!sessionToken || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        reportSecurityEvent('TAB_SWITCH', 'Student switched browser tab or minimized window');
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
      reportSecurityEvent('WINDOW_BLUR', 'Examination window lost focus to another application');
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try { navigator.clipboard.writeText(''); } catch (_) {}
        reportSecurityEvent('PRINT_SCREEN_ATTEMPT', 'PrintScreen key pressed');
        return false;
      }

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        reportSecurityEvent('DEVTOOLS_ATTEMPT', 'Developer tools shortcut triggered');
        return false;
      }

      if (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        reportSecurityEvent('DEVTOOLS_ATTEMPT', `Shortcut Ctrl+${e.key.toUpperCase()} blocked`);
        return false;
      }

      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        reportSecurityEvent('COPY_PASTE_ATTEMPT', `Clipboard shortcut Ctrl+${e.key.toUpperCase()} blocked`);
        return false;
      }
    };

    const handleBeforeUnload = () => {
      const data = JSON.stringify({ examId, sessionToken });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon('/api/sessions/interrupt', blob);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionToken, isLocked, reportSecurityEvent, examId]);

  const handleFullscreenExit = () => {
    reportSecurityEvent('FULLSCREEN_EXIT', 'Candidate exited fullscreen examination mode');
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/sessions/submit', {
        examId,
        sessionToken
      });
      sessionStorage.removeItem(`exam_token_${examId}`);
      window.location.hash = '#/completed';
    } catch (err) {
      alert(err.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await api.post('/sessions/submit', {
        examId,
        sessionToken
      });
      sessionStorage.removeItem(`exam_token_${examId}`);
      window.location.hash = '#/completed';
    } catch (_) {
      window.location.hash = '#/completed';
    }
  };

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white bg-grid-pattern">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-black tracking-tight">Initializing Examination Cockpit...</h2>
        <p className="text-slate-400 text-xs mt-1 font-mono">
          Verifying Single-Device Lock & Syncing Anti-Malpractice Telemetry
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-grid-pattern">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center text-white shadow-2xl glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Access Restricted</h2>
          <p className="text-xs text-red-300 mb-6 leading-relaxed">{error}</p>
          <a
            href="#/student"
            className="inline-block py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-grid-pattern">
        <div className="max-w-lg w-full bg-slate-900 border border-red-500/50 rounded-3xl p-8 text-center shadow-2xl glass-panel">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            EXAMINATION SESSION SUSPENDED
          </h2>
          <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-4 font-bold">
            Malpractice Strike Limit Reached ({violationsCount} / {maxViolations} Strikes)
          </p>

          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            {lockMessage || 'Your examination session has been suspended by the automated security monitor due to repeated tab switching, window focus loss, or fullscreen violations.'}
          </p>

          {resetSubmitted ? (
            <div className="p-5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs text-center font-medium">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
              <p className="font-bold text-white text-sm">Appeal Under Review</p>
              <p className="text-[11px] text-slate-300 mt-1">
                Your incident appeal is currently queued in the invigilator's approval desk. Please wait for authorization.
              </p>
              <a
                href="#/student"
                className="mt-4 inline-block py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Return to Dashboard
              </a>
            </div>
          ) : (
            <form onSubmit={handleSendResetAppeal} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  State Your Appeal for Re-entry
                </label>
                <textarea
                  required
                  rows={3}
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Explain why your window lost focus or session was interrupted..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href="#/student"
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition"
                >
                  Exit to Portal
                </a>
                <button
                  type="submit"
                  disabled={!resetReason.trim()}
                  className="py-2.5 px-6 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-red-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Appeal</span>
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none relative overflow-hidden">
        {/* Anti-Screen Peek Blur Mask (Triggered when window is unfocused/minimized) */}
        {isWindowBlurred && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center mb-4 shadow-2xl shadow-red-500/20">
              <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Visual Shield Activated: Window Unfocused
            </h3>
            <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
              You navigated away from the exam tab. Question paper view is masked to prevent external assistance or screenshot leakage.
            </p>
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
              Violations: {violationsCount} of {maxViolations} Permitted Strikes
            </div>
            <p className="text-[11px] text-slate-500 mt-4">
              Click anywhere on this screen to restore focus.
            </p>
          </div>
        )}

        {/* Floating Security Violation Alert Toast */}
        {recentViolationToast && (
          <div className="fixed top-20 right-6 z-40 max-w-sm w-full bg-red-950/95 border border-red-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-bounce">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Security Strike Recorded
                </p>
                <p className="text-xs text-red-200 mt-0.5">
                  {recentViolationToast.details}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{recentViolationToast.time}</span>
                  <span className="text-amber-400 font-bold">
                    Strikes: {violationsCount} / {maxViolations}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Examination Control Header */}
        <header className="bg-slate-900/95 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20 backdrop-blur-xl shadow-lg">
          {/* Left: Exam Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                  {exam?.exam_code}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-md">
                  {exam?.title}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Candidate: <strong className="text-slate-200">{user?.register_number}</strong> ({user?.name})
              </p>
            </div>
          </div>

          {/* Right: Countdown Clock, Telemetry Pill, Finish Button */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono text-sm sm:text-base font-black shadow-inner tracking-wider ${
                remainingSeconds !== null && remainingSeconds < 300
                  ? 'bg-red-950/80 border-red-500/60 text-red-400 animate-pulse'
                  : remainingSeconds !== null && remainingSeconds < 900
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-emerald-400'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Strike Indicator Capsule */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-500">Strikes:</span>
              <span className={`font-bold ${violationsCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {violationsCount}/{maxViolations}
              </span>
            </div>

            {/* Code of conduct button */}
            {exam?.instructions && (
              <button
                onClick={() => setShowInstructions(true)}
                className="hidden lg:flex items-center gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                title="View Exam Instructions"
              >
                <Info className="w-4 h-4" />
              </button>
            )}

            {/* Finish & Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-2.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Submit Paper</span>
            </button>
          </div>
        </header>

        {/* Main Body: Custom Secure PDF Canvas Viewer */}
        <div className="flex-1 p-3 sm:p-6 overflow-hidden flex flex-col">
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
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl glass-panel-glow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>

              <h3 className="text-xl font-black text-white text-center mb-2 tracking-tight">
                Finalize & Submit Exam?
              </h3>
              <p className="text-xs text-slate-300 text-center mb-6 leading-relaxed">
                Are you ready to submit your paper? Once confirmed, your responses are finalized and question paper access will be sealed immediately.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Return to Exam
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xl shadow-emerald-500/25 cursor-pointer"
                >
                  {submitting ? 'Sealing Paper...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Drawer */}
        {showInstructions && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass-panel">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <span>Exam Code of Conduct</span>
              </h3>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-6 font-mono">
                {exam?.instructions}
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        )}
      </div>
    </FullscreenGuard>
  );
}
