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
  RefreshCw,
  Search,
  Check,
  XCircle,
  Filter,
  Radio,
  User,
  Wifi
} from 'lucide-react';

export default function LiveExamMonitor() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const handleForceLock = async (sessionId, studentName) => {
    if (!window.confirm(`Force suspend session for candidate ${studentName}? Access will be revoked immediately.`)) return;
    try {
      await api.post(`/sessions/${sessionId}/force-lock`);
      fetchExamSessions();
    } catch (err) {
      alert(err.message || 'Failed to force lock session');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

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
              Real-time student telemetry: heartbeats, focus violations, strikes & appeal handling
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Selector */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
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
                  ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin text-orange-500' : ''}`} />
              <span>Sync: {autoRefresh ? '4s' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Filters & Candidate Search Bar */}
        <div className="extej-card p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate by Register Number or Full Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-orange-500 w-full sm:w-auto font-medium cursor-pointer"
          >
            <option value="">All Session Statuses</option>
            <option value="IN_PROGRESS">🟢 In Progress</option>
            <option value="LOCKED">🔴 Suspended (Locked)</option>
            <option value="INTERRUPTED">🟠 Interrupted</option>
            <option value="SUBMITTED">🔵 Submitted</option>
          </select>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            Connecting to real-time proctoring telemetry stream...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="extej-card p-16 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-800">Zero Active Candidates Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Candidates who enter this exam session will show up live with heartbeat status and strike counters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className={`extej-card p-5 flex flex-col justify-between ${
                    isLocked
                      ? 'border-rose-300 bg-rose-50/20'
                      : hasResetRequest
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'hover:border-orange-300'
                  }`}
                >
                  <div>
                    {/* Header: Register No and Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-xl">
                        {session.register_number}
                      </span>

                      {isLocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> SUSPENDED
                        </span>
                      ) : isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> SUBMITTED
                        </span>
                      ) : isInterrupted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> INTERRUPTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ONLINE
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-0.5">
                      {session.student_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {session.department || 'CSE'} • Yr {session.year || 'IV'} / Sec {session.section || 'A'}
                    </p>

                    {/* Telemetry Stats Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Strikes</span>
                        <span className={`font-bold text-sm ${session.violations_count > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                          {session.violations_count} strikes
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Last Heartbeat</span>
                        <span className="text-slate-700 text-xs font-semibold">
                          {session.last_heartbeat ? new Date(session.last_heartbeat).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Reset Request Appeal Banner */}
                    {hasResetRequest && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <p className="font-bold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Student Unlock Appeal:
                        </p>
                        <p className="text-slate-700 mt-1 italic">
                          "{session.reset_reason || 'Requesting re-entry'}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                    {hasResetRequest ? (
                      <>
                        <button
                          onClick={() => handleApproveReset(session.id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectReset(session.id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <>
                        {!isLocked && !isSubmitted && (
                          <button
                            onClick={() => handleForceLock(session.id, session.student_name)}
                            className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Force Suspend</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
