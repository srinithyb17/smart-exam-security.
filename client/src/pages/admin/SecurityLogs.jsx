import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
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
    <DashboardLayout currentPath="/admin/security" pageTitle="Forensic Audit Logs">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Anti-Malpractice Forensic Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tamper-evident logs of tab changes, fullscreen departures, shortcut violations, and screenshot attempts
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>

        {/* Filters */}
        <div className="extej-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => { setSelectedExamId(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.exam_code} - {ex.title}</option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={(e) => { setSelectedEventType(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Violation Types</option>
            <option value="FULLSCREEN_EXIT">Fullscreen Exit</option>
            <option value="WINDOW_BLUR">Tab Switching / Blur</option>
            <option value="DEVTOOLS_OPEN">DevTools Inspection</option>
            <option value="COPY_PASTE_ATTEMPT">Copy/Paste Attempt</option>
            <option value="STRIKE_THRESHOLD_EXCEEDED">Strike Limit Exceeded</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🔵 Low</option>
          </select>
        </div>

        {/* Audit Table */}
        <div className="extej-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Violation Event</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Loading telemetry events...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Zero security events logged for this filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800">{log.register_number}</span>
                        <span className="text-slate-400 block text-[11px]">{log.student_name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {log.event_type}
                      </td>
                      <td className="py-3.5 px-4">
                        {log.severity === 'CRITICAL' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                            CRITICAL
                          </span>
                        ) : log.severity === 'HIGH' ? (
                          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold">
                            HIGH
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                            {log.severity}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total: <strong>{totalLogs}</strong> forensic events</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-2 text-slate-600 font-bold">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
