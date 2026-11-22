import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  FileText,
  Lock,
  ChevronRight,
  Check
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
    <DashboardLayout currentPath="/admin/resets" pageTitle="Unlock Appeals Queue">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Unlock Appeals Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and adjudicate candidate appeals for accidental tab blurs, power cuts, or hardware disconnects
            </p>
          </div>

          <button
            onClick={fetchResetRequests}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            Checking for pending unlock appeals...
          </div>
        ) : requests.length === 0 ? (
          <div className="exam-card p-16 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <p className="text-base font-bold text-slate-800">No Pending Reset Appeals</p>
            <p className="text-xs text-slate-500 mt-1">
              All candidate sessions are currently clear and operating normally.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {requests.map((req) => (
              <div key={req.id} className="exam-card p-6 border-l-4 border-l-amber-500 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-xl">
                      {req.register_number}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      APPEAL PENDING
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {req.student_name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {req.exam_title} ({req.exam_code})
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs my-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Candidate Stated Reason:
                    </span>
                    <p className="text-slate-800 italic">
                      "{req.reset_reason || 'Candidate requested session unlock'}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Unlock</span>
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
