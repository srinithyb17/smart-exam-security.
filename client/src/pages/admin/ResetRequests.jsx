import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  FileText,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function ResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResetRequests = async () => {
    try {
      setLoading(true);
      const examsRes = await api.get('/exams');
      const examsList = examsRes.exams || [];

      const allSessionsPromises = examsList.map(e => api.get(`/sessions/exam/${e.id}`));
      const allSessionsRes = await Promise.all(allSessionsPromises);

      const pending = [];
      allSessionsRes.forEach((res, i) => {
        const exam = examsList[i];
        (res.sessions || []).forEach(s => {
          if (s.reset_status === 'REQUESTED') {
            pending.push({ ...s, exam_title: exam.title, exam_code: exam.exam_code });
          }
        });
      });

      setRequests(pending);
    } catch (err) {
      console.error('Failed to load reset requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResetRequests();
    const interval = setInterval(fetchResetRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/approve-reset`);
      fetchResetRequests();
    } catch (err) {
      alert(err.message || 'Failed to approve reset');
    }
  };

  const handleReject = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/reject-reset`);
      fetchResetRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject reset');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern">
      <Navbar currentPath="/admin/resets" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Invigilator Authorization Desk
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Candidate Unlock Appeals
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold">
                {requests.length} Pending
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Review incident explanations and authorize candidate re-entry for interrupted or suspended sessions
            </p>
          </div>

          <button
            onClick={fetchResetRequests}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Queue</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">Checking appeal queue...</div>
        ) : requests.length === 0 ? (
          <div className="glass-panel border border-slate-800 rounded-3xl p-16 text-center text-slate-400 shadow-2xl">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Zero Pending Appeals</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All candidates currently taking examinations are operating within permissible strike thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="glass-panel border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      {req.exam_code}
                    </span>
                    <h3 className="font-bold text-white text-base">
                      {req.student_name} (<span className="font-mono text-slate-300">{req.register_number}</span>)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 font-mono">
                    Dept: {req.department} • Status: <strong className="text-red-400">{req.status}</strong> • Strikes: <strong className="text-amber-400">{req.violations_count}</strong>
                  </p>

                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs text-slate-200 font-mono">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                      Candidate Incident Explanation:
                    </span>
                    "{req.reset_reason || 'Interrupted session'}"
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono">
                    Logged at {new Date(req.reset_requested_at).toLocaleTimeString()} from IP {req.ip_address}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-900 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 sm:flex-none py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-bold text-white shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Unlock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
