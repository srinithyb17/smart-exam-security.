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
  FileText,
  User,
  GraduationCap,
  RefreshCw,
  Send
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

  const fetchStudentExams = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.get('/exams/student');
      setExams(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load exam schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
    const interval = setInterval(() => fetchStudentExams(), 15000); // Polling every 15s
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
      setResetSuccessMessage('Your reset appeal has been submitted to the administrator.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentPath="/student" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Student Profile Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Examination Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {user?.name || 'Student'}
              </h1>
              <p className="text-slate-400 text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                <span>Reg No: <strong className="text-slate-200">{user?.register_number}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-slate-200">{user?.department || 'Engineering'}</strong></span>
                <span>•</span>
                <span>Year/Sec: <strong className="text-slate-200">{user?.year || 'IV'} - {user?.section || 'A'}</strong></span>
              </p>
            </div>

            <button
              onClick={() => fetchStudentExams(true)}
              disabled={refreshing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Schedules'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-sm mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: ACTIVE EXAMINATIONS (Available Now) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl font-bold text-white">Active Examinations</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                Available Now ({exams.available.length})
              </span>
            </div>
          </div>

          {exams.available.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-8 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">There are no active exams scheduled right now.</p>
              <p className="text-xs text-slate-500 mt-1">Check the upcoming exams schedule below.</p>
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
                    className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-xl p-6 flex flex-col justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                          {exam.exam_code}
                        </span>
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          In Progress
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{exam.subject}</p>

                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Duration:</span>
                          <span className="font-semibold text-white">{exam.duration_minutes} Mins</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Scheduled End:</span>
                          <span className="font-mono text-slate-200">
                            {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Max Violations:</span>
                          <span className="text-amber-400 font-semibold">{exam.max_violations} strikes</span>
                        </div>
                      </div>

                      {/* Locked / Interrupted Alert Banner */}
                      {isLocked && (
                        <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-200">Session Locked</p>
                            <p className="text-[11px] text-red-300">
                              Violations exceeded limit.
                            </p>
                          </div>
                        </div>
                      )}

                      {isInterrupted && !isLocked && (
                        <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-200">Session Interrupted</p>
                            <p className="text-[11px] text-amber-300">
                              Browser or tab closed abruptly.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                      {isLocked ? (
                        hasPendingReset ? (
                          <div className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium text-center">
                            Reset Request Pending Approval
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenResetModal(exam)}
                            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Request Session Reset
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{exam.session_status === 'IN_PROGRESS' ? 'Resume Examination' : 'Enter Examination'}</span>
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
            <h2 className="text-xl font-bold text-white">Upcoming Examinations</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
              {exams.upcoming.length}
            </span>
          </div>

          {exams.upcoming.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-8 text-center text-slate-400">
              <p className="text-sm">No upcoming exams scheduled at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.upcoming.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                        {exam.exam_code}
                      </span>
                      <span className="text-xs font-medium text-slate-400">Scheduled</span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{exam.subject}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date & Time:</span>
                        <span className="font-mono text-slate-200">
                          {new Date(exam.start_time).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-semibold text-white">{exam.duration_minutes} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Paper unlocks at scheduled time
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
            <h2 className="text-xl font-bold text-white">Completed Examinations</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
              {exams.completed.length}
            </span>
          </div>

          {exams.completed.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-8 text-center text-slate-400">
              <p className="text-sm">No exam submissions recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.completed.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between opacity-85"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold">
                        {exam.exam_code}
                      </span>
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Submitted
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{exam.subject}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                    <span>Paper Access Expired</span>
                    <span className="font-mono text-emerald-400 text-[11px]">Recorded in Audit Log</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Session Reset Request Appeal Modal */}
      {resetModalExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Request Session Unlock
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your exam session for <strong>{resetModalExam.title}</strong> is currently interrupted or locked. Please provide an explanation to the examination controller for approval.
            </p>

            {resetSuccessMessage ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-medium">
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitResetRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Reason for Interruption
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="e.g. Browser crashed due to power cut, accidental tab closure, etc."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalExam(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReset || !resetReason.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReset ? 'Submitting...' : 'Send Appeal'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
