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
  FileText
} from 'lucide-react';

export default function ResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResetRequests = async () => {
    try {
      setLoading(true);
      // Fetch all exams and aggregate requested sessions
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
    const interval = setInterval(fetchResetRequests, 6000);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentPath="/admin" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-extrabold text-white">Student Session Reset Approvals</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold">
                {requests.length} pending appeals
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Review and authorize students requesting re-entry due to accidental interruption or locked sessions
            </p>
          </div>

          <button
            onClick={fetchResetRequests}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Checking pending requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Zero Pending Reset Requests</h3>
            <p className="text-xs text-slate-500">
              No students are currently locked out or awaiting reset authorization.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      {req.exam_code}
                    </span>
                    <h3 className="font-bold text-white text-base">
                      {req.student_name} (<span className="font-mono text-slate-300">{req.register_number}</span>)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 font-mono">
                    Dept: {req.department} • Status: <strong className="text-red-400">{req.status}</strong> • Strikes: <strong className="text-amber-400">{req.violations_count}</strong>
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold mb-0.5">
                      Student Explanation
                    </span>
                    "{req.reset_reason || 'Interrupted session'}"
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono">
                    Submitted at {new Date(req.reset_requested_at).toLocaleTimeString()} from IP {req.ip_address}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 sm:flex-none py-2 px-4 bg-slate-800 hover:bg-red-600 hover:text-white rounded-xl text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 sm:flex-none py-2 px-5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
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
