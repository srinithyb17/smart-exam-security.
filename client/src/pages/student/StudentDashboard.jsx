import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
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
  Award,
  Check,
  ArrowRight
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
    <DashboardLayout currentPath="/student" pageTitle="My Examination Schedule">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Examination Gateway
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select an active question paper to enter proctored testing. Strict fullscreen and single-device lock active.
            </p>
          </div>
          <button
            onClick={() => fetchStudentExams(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Candidate Official Hall-Ticket Card */}
        <div className="hall-ticket-card p-6 sm:p-7 max-w-xl exam-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  OFFICIAL ADMIT CARD
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Autonomous College Assessment
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>AUTHENTICATED</span>
            </div>
          </div>

          <div className="my-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Register Number
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black tracking-widest text-slate-900">
              {user?.register_number || '910021104001'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Candidate Name</span>
              <span className="font-bold text-slate-800 uppercase">{user?.name || 'STUDENT'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="font-bold text-slate-800">{user?.department || 'CSE'} - Yr {user?.year || 'IV'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Academic Year</span>
              <span className="font-bold text-slate-800">2026-27</span>
            </div>
          </div>
        </div>

        {/* Section: Active Examinations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-base font-bold text-slate-900">
              Active Question Papers ({exams.available.length})
            </h2>
          </div>

          {exams.available.length === 0 ? (
            <div className="exam-card p-8 text-center text-slate-400 text-xs font-medium">
              No active examination papers at this moment. Scheduled papers will appear automatically when released.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exams.available.map((exam) => (
                <div
                  key={exam.id}
                  className="exam-card p-6 flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-blue-600"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                        {exam.course_code}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        PAPER RELEASED
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {exam.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-3 py-2 bg-slate-50 rounded-xl px-3 border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.duration_minutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Max {exam.max_strikes} Strikes</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    {exam.session_status === 'locked' ? (
                      <button
                        onClick={() => handleOpenResetModal(exam)}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span>Session Locked • Submit Appeal</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedInstructionExam(exam)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Enter Exam Cockpit</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Upcoming Papers */}
        {exams.upcoming.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-bold text-slate-900">
              Upcoming Scheduled Papers ({exams.upcoming.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.upcoming.map((exam) => (
                <div key={exam.id} className="exam-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{exam.course_code}</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      SCHEDULED
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2">{exam.title}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Starts: {new Date(exam.start_time).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Completed Papers */}
        {exams.completed.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-bold text-slate-900">
              Submitted Examination History ({exams.completed.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.completed.map((exam) => (
                <div key={exam.id} className="exam-card p-5 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{exam.course_code}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <Check className="w-3 h-3" /> SEALED & SUBMITTED
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2">{exam.title}</h4>
                  <button
                    onClick={() => window.location.hash = '#/completed'}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    View Official Digital Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules / Pre-Exam Instructions Modal */}
      {selectedInstructionExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="exam-card max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Proctored Examination Instructions
                </h3>
                <p className="text-xs text-slate-500">{selectedInstructionExam.title} ({selectedInstructionExam.course_code})</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80 my-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>The exam must run in <strong>Strict Fullscreen Mode</strong> throughout the session.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Tab switching, window resizing, or external monitors trigger automatic malpractice strikes.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Exceeding <strong>{selectedInstructionExam.max_strikes} strikes</strong> automatically suspends your paper.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Your Register Number is dynamically watermarked across every page for leak forensics.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedInstructionExam(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const examId = selectedInstructionExam.id;
                  setSelectedInstructionExam(null);
                  handleStartExam(examId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Accept & Enter Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lockout Appeal Modal */}
      {resetModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="exam-card max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Appeal Session Unlock
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your exam session was suspended due to policy violations. Submit an appeal to the chief invigilator.
            </p>

            {resetSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 text-center">
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitResetRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Reason for Lockout / Appeal Justification
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="Describe what occurred (e.g., accidental trackpad swipe, power interruption)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setResetModalExam(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReset}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                  >
                    {submittingReset ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
