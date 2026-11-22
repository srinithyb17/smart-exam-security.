import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Eye,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Check,
  XCircle,
  Filter,
  User,
  Trash2,
  Send,
  FileCheck,
  FileText,
  AlertOctagon,
  ChevronRight,
  Wifi,
  ExternalLink
} from 'lucide-react';

export default function LiveExamMonitor() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [inspectSession, setInspectSession] = useState(null);
  const [strikeModalSession, setStrikeModalSession] = useState(null);
  const [strikeReason, setStrikeReason] = useState('Observed unauthorized communication or material');

  // 1. Fetch all exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.get('/exams');
        setExams(data.exams || []);
        if (data.exams && data.exams.length > 0) {
          const params = new URLSearchParams(window.location.hash.split('?')[1]);
          const queryExamId = params.get('examId');
          setSelectedExamId(queryExamId || data.exams[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load exams list:', err);
      }
    };
    fetchExams();
  }, []);

  // 2. Fetch Sessions for selected exam
  const fetchExamSessions = async () => {
    if (!selectedExamId) return;
    try {
      const data = await api.get(`/sessions/exam/${selectedExamId}`);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load exam sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamSessions();
    if (!autoRefresh) return;
    const interval = setInterval(fetchExamSessions, 4000);
    return () => clearInterval(interval);
  }, [selectedExamId, autoRefresh]);

  // Actions
  const handleRemoveFromCockpit = async (sessionId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from the live cockpit? This will terminate their active session and allow a fresh start.`)) return;
    try {
      await api.delete(`/sessions/${sessionId}`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to remove session from cockpit');
    }
  };

  const handleManualUnlock = async (sessionId, studentName) => {
    if (!window.confirm(`Unlock and re-admit candidate ${studentName}? Their strikes will be cleared to 0.`)) return;
    try {
      await api.post(`/sessions/${sessionId}/unlock`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to unlock session');
    }
  };

  const handleForceLock = async (sessionId, studentName) => {
    if (!window.confirm(`Force suspend session for candidate ${studentName}? Access will be revoked immediately.`)) return;
    try {
      await api.post(`/sessions/${sessionId}/force-lock`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to force lock session');
    }
  };

  const handleForceSubmit = async (sessionId, studentName) => {
    if (!window.confirm(`Force submit and seal examination paper for ${studentName}? This action is irreversible.`)) return;
    try {
      await api.post(`/sessions/${sessionId}/force-submit`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to force submit paper');
    }
  };

  const handleIssueStrike = async (e) => {
    e.preventDefault();
    if (!strikeModalSession) return;
    try {
      const res = await api.post(`/sessions/${strikeModalSession.id}/strike`, { reason: strikeReason });
      alert(res.message);
      setStrikeModalSession(null);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to issue strike');
    }
  };

  const handleApproveReset = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/approve-reset`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to approve reset');
    }
  };

  const handleRejectReset = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/reject-reset`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to reject reset');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // Calculate live counts
  const totalInRoom = sessions.length;
  const activeCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;
  const lockedCount = sessions.filter(s => s.status === 'LOCKED').length;
  const appealsCount = sessions.filter(s => s.reset_status === 'REQUESTED').length;
  const submittedCount = sessions.filter(s => s.status === 'SUBMITTED').length;

  return (
    <DashboardLayout currentPath="/admin/monitor" pageTitle="Live Proctor Cockpit">
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Proctoring Cockpit
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time candidate telemetry: heartbeats, focus violations, strikes & instant proctor controls
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Selector */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_code} - {ex.title}
                </option>
              ))}
            </select>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                autoRefresh
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin text-blue-600' : ''}`} />
              <span>Sync: {autoRefresh ? '4s' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Live Status KPI Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Candidates</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalInRoom}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs text-center bg-emerald-50/30">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-mono">🟢 Online Active</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs text-center bg-rose-50/30">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block font-mono">🔴 Suspended</span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block">{lockedCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs text-center bg-amber-50/30">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block font-mono">🟡 Appeals</span>
            <span className="text-xl font-black text-amber-600 mt-0.5 block">{appealsCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs text-center bg-blue-50/30">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block font-mono">🔵 Submitted</span>
            <span className="text-xl font-black text-blue-600 mt-0.5 block">{submittedCount}</span>
          </div>
        </div>

        {/* Filters & Candidate Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate by Register Number or Full Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-full sm:w-auto font-medium cursor-pointer"
          >
            <option value="">All Session Statuses</option>
            <option value="IN_PROGRESS">🟢 Online (In Progress)</option>
            <option value="LOCKED">🔴 Suspended (Locked)</option>
            <option value="INTERRUPTED">🟠 Interrupted</option>
            <option value="SUBMITTED">🔵 Submitted & Sealed</option>
          </select>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-mono">
            Connecting to real-time proctoring telemetry stream...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-800">No Candidates Currently Active</p>
            <p className="text-xs text-slate-500 mt-1">
              Candidates who start this exam paper will appear live in the cockpit with real-time heartbeat and strike meters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isLocked = session.status === 'LOCKED';
              const isInProgress = session.status === 'IN_PROGRESS';
              const isInterrupted = session.status === 'INTERRUPTED';
              const isSubmitted = session.status === 'SUBMITTED';
              const hasResetRequest = session.reset_status === 'REQUESTED';

              let recentLogs = [];
              try {
                recentLogs = session.recent_logs ? JSON.parse(session.recent_logs) : [];
              } catch (_) {}

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isLocked
                      ? 'border-rose-400 bg-rose-50/15'
                      : hasResetRequest
                      ? 'border-amber-400 bg-amber-50/15'
                      : isSubmitted
                      ? 'border-blue-300 bg-blue-50/10'
                      : 'border-emerald-300'
                  }`}
                >
                  <div>
                    {/* Header: Register No and Status Badge */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 font-mono">
                          {session.student_name ? session.student_name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <span className="font-mono font-black text-slate-900 text-xs block leading-tight">
                            {session.register_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            IP: {session.ip_address || '127.0.0.1'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isLocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-black font-mono flex items-center gap-1 shadow-xs">
                          <Lock className="w-3 h-3" /> SUSPENDED
                        </span>
                      ) : hasResetRequest ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black font-mono flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> APPEAL PENDING
                        </span>
                      ) : isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 text-[10px] font-bold font-mono flex items-center gap-1 shadow-xs">
                          <CheckCircle className="w-3 h-3" /> SUBMITTED
                        </span>
                      ) : isInterrupted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-bold font-mono flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3 h-3" /> INTERRUPTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-mono flex items-center gap-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          ONLINE
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-0.5">
                      {session.student_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {session.department || 'CSE'} • Yr {session.year || 'IV'} / Sec {session.section || 'A'}
                    </p>

                    {/* Telemetry Stats Bar */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold font-mono">Malpractice Strikes</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`font-black text-sm ${session.violations_count > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {session.violations_count} strikes
                          </span>
                          {session.violations_count >= 3 && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">MAX</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold font-mono">Heartbeat Sync</span>
                        <span className="text-slate-800 text-xs font-semibold mt-0.5 block font-mono">
                          {session.last_heartbeat ? new Date(session.last_heartbeat).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Reset Request Appeal Banner */}
                    {hasResetRequest && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs">
                        <p className="font-bold text-amber-800 flex items-center gap-1.5 font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Candidate Stated Appeal:
                        </p>
                        <p className="text-slate-800 mt-1 italic leading-relaxed">
                          "{session.reset_reason || 'Requesting session unlock'}"
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
                          <button
                            onClick={() => handleApproveReset(session.id)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Appeal</span>
                          </button>
                          <button
                            onClick={() => handleRejectReset(session.id)}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Proctoring Control Actions Bar (Clear, Prominent Buttons) */}
                  <div className="pt-4 mt-4 border-t border-slate-200/80 space-y-2">
                    {/* Primary Status Controls */}
                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <button
                          onClick={() => handleManualUnlock(session.id, session.student_name)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Clear strikes and unlock candidate session"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock & Re-Admit</span>
                        </button>
                      ) : !isSubmitted ? (
                        <>
                          <button
                            onClick={() => handleForceLock(session.id, session.student_name)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Immediately suspend session due to cheating"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Force Suspend</span>
                          </button>
                          <button
                            onClick={() => { setStrikeModalSession(session); }}
                            className="py-2 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Issue manual warning strike"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>+1 Strike</span>
                          </button>
                        </>
                      ) : null}
                    </div>

                    {/* Secondary Actions: Force Submit, View Logs, Remove from Cockpit */}
                    <div className="flex items-center gap-2 pt-1">
                      {!isSubmitted && (
                        <button
                          onClick={() => handleForceSubmit(session.id, session.student_name)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Finalize and seal candidate's exam"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Force Submit</span>
                        </button>
                      )}

                      <button
                        onClick={() => setInspectSession(session)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="View forensic audit trail for this student"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Logs</span>
                      </button>

                      {/* Prominent REMOVE FROM COCKPIT button */}
                      <button
                        onClick={() => handleRemoveFromCockpit(session.id, session.student_name)}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Evict candidate session from live cockpit"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Forensic Log Inspector Drawer / Modal */}
      {inspectSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Forensic Telemetry: {inspectSession.student_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Register No: {inspectSession.register_number} • IP: {inspectSession.ip_address || '127.0.0.1'}
                </p>
              </div>
              <button
                onClick={() => setInspectSession(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
              {(() => {
                let logs = [];
                try {
                  logs = inspectSession.recent_logs ? JSON.parse(inspectSession.recent_logs) : [];
                } catch (_) {}

                if (logs.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No security violations recorded for this candidate.
                    </div>
                  );
                }

                return logs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 font-mono">{log.event_type}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ));
              })()}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectSession(null)}
                className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Strike Modal */}
      {strikeModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Issue Official Strike
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Issuing strike to <strong>{strikeModalSession.student_name}</strong> ({strikeModalSession.register_number}).
              Current: {strikeModalSession.violations_count} strikes.
            </p>

            <form onSubmit={handleIssueStrike} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Violation Reason / Incident Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStrikeModalSession(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Strike (+1)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
