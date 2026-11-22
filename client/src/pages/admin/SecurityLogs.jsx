import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams').then(res => setExams(res.exams || [])).catch(() => {});
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        examId: selectedExamId,
        eventType: selectedEventType,
        severity: selectedSeverity
      });

      const data = await api.get(`/telemetry/logs?${params.toString()}`);
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalLogs(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedExamId, selectedEventType, selectedSeverity]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern">
      <Navbar currentPath="/admin/security" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                Anti-Malpractice Forensics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Security Audit Logs
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-bold">
                {totalLogs} Events Logged
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Tamper-evident trail of tab switches, focus losses, multi-device login conflicts & screenshot attempts
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Audit Log</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel border border-slate-800 rounded-3xl p-4 mb-6 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => { setSelectedExamId(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-mono cursor-pointer"
          >
            <option value="">All Scheduled Examinations</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.exam_code} - {e.title}</option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={(e) => { setSelectedEventType(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-mono cursor-pointer"
          >
            <option value="">All Incident Classifications</option>
            <option value="TAB_SWITCH">Tab Switching (Visibility Mask)</option>
            <option value="WINDOW_BLUR">Window Focus Loss</option>
            <option value="FULLSCREEN_EXIT">Fullscreen Mode Exit</option>
            <option value="DEVTOOLS_ATTEMPT">Developer Tools / Shortcuts</option>
            <option value="PRINT_SCREEN_ATTEMPT">PrintScreen / Screenshot Attempt</option>
            <option value="COPY_PASTE_ATTEMPT">Clipboard Shortcut Intercept</option>
            <option value="UNAUTHORIZED_LOGIN">Concurrent Multi-Device Login</option>
            <option value="SESSION_LOCKED">Automated Session Suspension</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white font-mono cursor-pointer"
          >
            <option value="">All Severity Thresholds</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="glass-panel border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Incident Category</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Forensic Description</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4 text-right">Origin IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 font-mono">
                      Querying tamper-evident security telemetry records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No security incidents found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {log.event_type}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-200">{log.student_name}</span>
                        <span className="block font-mono text-[11px] text-blue-400">{log.register_number}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-300 font-semibold">{log.exam_code || 'General'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate text-[11px]">
                        {log.details || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            log.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : log.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : log.severity === 'MEDIUM'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-slate-800 rounded-xl hover:bg-slate-700 disabled:opacity-30 cursor-pointer font-bold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 bg-slate-800 rounded-xl hover:bg-slate-700 disabled:opacity-30 cursor-pointer font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
