import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
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
  Filter
} from 'lucide-react';

export default function LiveExamMonitor() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Fetch all exams for dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.get('/exams');
        setExams(data.exams || []);
        if (data.exams && data.exams.length > 0) {
          // Check URL query param or pick first active exam
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
    const interval = setInterval(fetchExamSessions, 5000); // Live real-time polling every 5s
    return () => clearInterval(interval);
  }, [selectedExamId, autoRefresh]);

  // Actions: Approve Reset, Reject Reset, Force Lock
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
    if (!window.confirm(`Force lock student ${studentName}'s session? They will be locked out immediately.`)) return;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentPath="/admin/monitor" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-extrabold text-white">Live Examination Monitor</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time Telemetry
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Active invigilation room: track student presence, heartbeats, tab switches, and approve reset appeals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Selector */}
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                autoRefresh
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>Auto-Sync: {autoRefresh ? 'ON (5s)' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Register Number or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="LOCKED">Locked</option>
            <option value="INTERRUPTED">Interrupted</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            Connecting to real-time session stream...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-white">No Active Sessions Recorded Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Students who enter this examination will show up live here with real-time heartbeat and telemetry.
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

              // Parse recent logs
              let recentLogs = [];
              try {
                recentLogs = session.recent_logs ? JSON.parse(session.recent_logs) : [];
              } catch (_) {}

              return (
                <div
                  key={session.id}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition ${
                    isLocked
                      ? 'border-red-500/60 bg-red-950/10'
                      : hasResetRequest
                      ? 'border-amber-500/60 bg-amber-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header: Register No and Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-white text-sm">
                        {session.register_number}
                      </span>

                      {/* Status Badges */}
                      {isLocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Submitted
                        </span>
                      ) : isInterrupted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Interrupted
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-0.5">
                      {session.student_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {session.department || 'CSE'} • Yr {session.year || 'IV'}-{session.section || 'A'}
                    </p>

                    {/* Telemetry Stats Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Violations</span>
                        <span className={`font-bold ${session.violations_count > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {session.violations_count} strikes
                        </span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Heartbeat</span>
                        <span className="text-slate-300">
                          {session.last_heartbeat ? new Date(session.last_heartbeat).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Reset Request Appeal Banner */}
                    {hasResetRequest && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs">
                        <p className="font-bold text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Student Reset Appeal:
                        </p>
                        <p className="text-slate-300 mt-1 italic">
                          "{session.reset_reason || 'Requesting re-entry'}"
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Requested at {new Date(session.reset_requested_at).toLocaleTimeString()}
                        </p>
                      </div>
                    )}

                    {/* Recent Incident Mini-Timeline */}
                    {recentLogs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <p className="text-[10px] uppercase font-mono text-slate-500 font-semibold mb-1.5">
                          Recent Activity
                        </p>
                        <div className="space-y-1">
                          {recentLogs.slice(0, 2).map((log, i) => (
                            <div key={i} className="text-[11px] text-slate-400 flex items-center justify-between">
                              <span className="truncate max-w-[170px] text-red-300">{log.event_type}</span>
                              <span className="font-mono text-[10px] text-slate-600">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Invigilator Action Controls */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {hasResetRequest ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleApproveReset(session.id)}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectReset(session.id)}
                          className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-500 font-mono">
                          IP: {session.ip_address || '127.0.0.1'}
                        </span>
                        {isInProgress && (
                          <button
                            onClick={() => handleForceLock(session.id, session.student_name)}
                            className="py-1 px-3 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition"
                          >
                            Lock Session
                          </button>
                        )}
                        {isLocked && (
                          <button
                            onClick={() => handleApproveReset(session.id)}
                            className="py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Unlock Student
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
      </main>
    </div>
  );
}
