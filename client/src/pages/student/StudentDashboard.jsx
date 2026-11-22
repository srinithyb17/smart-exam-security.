import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
import {
  Calendar,
  Clock,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  User,
  GraduationCap,
  RefreshCw,
  Send,
  Info,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState({ available: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Reset Request Modal State
  const [resetModalExam, setResetModalExam] = useState(null);
  const [resetReason, setResetReason] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Instructions Modal
  const [selectedInstructionExam, setSelectedInstructionExam] = useState(null);

  const fetchStudentExams = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.get('/exams/student');
      setExams(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load examination schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
    const interval = setInterval(() => fetchStudentExams(), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStartExam = (examId) => {
    window.location.hash = `#/exam/${examId}`;
  };

  const handleOpenResetModal = (exam) => {
    setResetModalExam(exam);
    setResetReason('');
    setResetSuccessMessage('');
  };

  const handleSubmitResetRequest = async (e) => {
    e.preventDefault();
    if (!resetReason.trim()) return;
    setSubmittingReset(true);
    try {
      await api.post('/sessions/request-reset', {
        examId: resetModalExam.id,
        reason: resetReason.trim()
      });
      setResetSuccessMessage('Your appeal has been securely submitted to the chief invigilator.');
      setTimeout(() => {
        setResetModalExam(null);
        fetchStudentExams();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to submit reset request');
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern">
      <Navbar currentPath="/student" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Official Identity Hall-Ticket Card */}
        <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 shadow-2xl mb-8 overflow-hidden glass-panel">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20 border border-blue-400/30 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Verified Candidate Roster</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user?.name || 'Candidate'}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                  <span>Register No: <strong className="text-blue-400">{user?.register_number}</strong></span>
                  <span>•</span>
                  <span>Department: <strong className="text-slate-200">{user?.department || 'Engineering'}</strong></span>
                  <span>•</span>
                  <span>Academic Standing: <strong className="text-slate-200">Year {user?.year || 'IV'} / Sec {user?.section || 'A'}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <button
                onClick={() => fetchStudentExams(true)}
                disabled={refreshing}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Sync Timetable'}</span>
              </button>
            </div>
          </div>

          {/* Academic Advisory Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session Telemetry & Dynamic Watermarking Active</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Ensure stable connectivity • Fullscreen required throughout exam
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-xs mb-6 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: ACTIVE EXAMINATIONS (Available Now) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Examinations</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold font-mono">
                {exams.available.length} Available
              </span>
            </div>
          </div>

          {exams.available.length === 0 ? (
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-10 text-center text-slate-400 glass-panel">
              <Clock className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No Examinations In Progress</p>
              <p className="text-xs text-slate-500 mt-1">There are no active exam papers scheduled for your department right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.available.map((exam) => {
                const isLocked = exam.session_status === 'LOCKED';
                const isInterrupted = exam.session_status === 'INTERRUPTED';
                const hasPendingReset = exam.reset_status === 'REQUESTED';

                return (
                  <div
                    key={exam.id}
                    className={`rounded-3xl border p-6 flex flex-col justify-between transition-all shadow-xl glass-panel ${
                      isLocked
                        ? 'border-red-500/50 bg-red-950/15'
                        : isInterrupted
                        ? 'border-amber-500/50 bg-amber-950/15'
                        : 'border-slate-800 hover:border-blue-500/40 hover:shadow-blue-500/10'
                    }`}
                  >
                    <div>
                      {/* Top Code Pill & Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                          {exam.exam_code}
                        </span>
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          LIVE NOW
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{exam.subject}</p>

                      {/* Admit Card Meta Matrix */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Duration:</span>
                          <span className="font-bold text-white">{exam.duration_minutes} Minutes</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Scheduled End:</span>
                          <span className="text-slate-200">
                            {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Violation Limit:</span>
                          <span className="text-amber-400 font-bold">{exam.max_violations} strikes max</span>
                        </div>
                      </div>

                      {/* Lock / Interrupted Warning Badges */}
                      {isLocked && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-200">Session Suspended</p>
                            <p className="text-[11px] text-red-300 mt-0.5">
                              Exceeded permissible violation strikes. Submit an appeal to the invigilator.
                            </p>
                          </div>
                        </div>
                      )}

                      {isInterrupted && !isLocked && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-200">Session Interrupted</p>
                            <p className="text-[11px] text-amber-300 mt-0.5">
                              Previous browser session was closed abruptly. Click resume to proceed.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                      {isLocked ? (
                        hasPendingReset ? (
                          <div className="py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold text-center font-mono">
                            Appeal Under Review by Invigilator
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenResetModal(exam)}
                            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Request Session Unlock</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam.id)}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 transition cursor-pointer transform hover:-translate-y-0.5"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{exam.session_status === 'IN_PROGRESS' ? 'Resume Examination' : 'Enter Examination Hall'}</span>
                        </button>
                      )}

                      {exam.instructions && (
                        <button
                          onClick={() => setSelectedInstructionExam(exam)}
                          className="w-full py-1 text-center text-[11px] text-slate-500 hover:text-slate-300 transition"
                        >
                          View Exam Code of Conduct
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: UPCOMING EXAMINATIONS */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Timetable</h2>
            <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-semibold font-mono">
              {exams.upcoming.length} Scheduled
            </span>
          </div>

          {exams.upcoming.length === 0 ? (
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 text-center text-slate-500">
              <p className="text-xs">No upcoming examinations scheduled on your timetable.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.upcoming.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-6 flex flex-col justify-between glass-panel"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                        {exam.exam_code}
                      </span>
                      <span className="text-xs font-mono text-slate-500">Scheduled</span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{exam.title}</h3>
                    <p className="text-xs text-slate-400">{exam.subject}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Start Date:</span>
                        <span className="text-slate-200">
                          {new Date(exam.start_time).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Duration:</span>
                        <span className="font-bold text-white">{exam.duration_minutes} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="py-2.5 px-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-500 text-xs font-medium text-center flex items-center justify-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      Unlocks automatically at start time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: COMPLETED EXAMINATIONS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Submission History</h2>
            <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-semibold font-mono">
              {exams.completed.length} Completed
            </span>
          </div>

          {exams.completed.length === 0 ? (
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 text-center text-slate-500">
              <p className="text-xs">No exam submissions recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.completed.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col justify-between opacity-80"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono font-bold">
                        {exam.exam_code}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        SUBMITTED
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-200">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{exam.subject}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-500 flex items-center justify-between">
                    <span>Paper Sealed</span>
                    <span className="text-emerald-400 text-[11px]">Audit Log Verified</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Reset Request Appeal Modal */}
      {resetModalExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass-panel-glow">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <span>Session Unlock Appeal</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your exam session for <strong>{resetModalExam.title}</strong> is locked. State your explanation to the examination controller.
            </p>

            {resetSuccessMessage ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs text-center font-medium">
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitResetRequest} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Incident Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="e.g. Accidental window minimize due to system notification, hardware stutter..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalExam(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReset || !resetReason.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/25"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReset ? 'Transmitting...' : 'Submit Appeal'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {selectedInstructionExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass-panel">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Examination Rules</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              {selectedInstructionExam.exam_code} - {selectedInstructionExam.title}
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-6 font-mono">
              {selectedInstructionExam.instructions}
            </div>
            <button
              onClick={() => setSelectedInstructionExam(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
