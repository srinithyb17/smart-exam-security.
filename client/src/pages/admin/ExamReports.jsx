import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  BarChart2,
  Download,
  Printer,
  Users,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Clock,
  Award,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function ExamReports() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [participationData, setParticipationData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load exams for report:', err);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const [partRes, secRes] = await Promise.all([
          api.get(`/reports/exam/${selectedExamId}/participation`),
          api.get(`/reports/exam/${selectedExamId}/security`)
        ]);
        setParticipationData(partRes);
        setSecurityData(secRes);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedExamId]);

  const handleDownloadCSV = () => {
    if (!selectedExamId) return;
    window.open(`/api/reports/exam/${selectedExamId}/export`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const currentExam = exams.find((e) => e.id.toString() === selectedExamId.toString());

  return (
    <DashboardLayout currentPath="/admin/reports" pageTitle="Audit Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Examination Audit & Forensics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Controller of Examinations official participation breakdown and malpractice forensics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_code} - {ex.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] hover:from-[#f06a0a] hover:to-[#ff831a] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Audit Sheet</span>
            </button>
          </div>
        </div>

        {loading || !participationData ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            Synthesizing examination report data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="extej-card p-5">
                <span className="text-[11px] text-slate-400 block font-semibold">Total Enrolled</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {participationData.total_enrolled}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Candidates</span>
              </div>

              <div className="extej-card p-5">
                <span className="text-[11px] text-slate-400 block font-semibold">Active & Attended</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {participationData.active_count + participationData.submitted_count}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                  {Math.round(((participationData.active_count + participationData.submitted_count) / (participationData.total_enrolled || 1)) * 100)}% Attendance
                </span>
              </div>

              <div className="extej-card p-5">
                <span className="text-[11px] text-slate-400 block font-semibold">Verified Submissions</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">
                  {participationData.submitted_count}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Cryptographically Signed</span>
              </div>

              <div className="extej-card p-5">
                <span className="text-[11px] text-slate-400 block font-semibold">Suspended / Locked</span>
                <span className={`text-2xl font-black mt-1 block ${participationData.locked_count > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {participationData.locked_count}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Policy Violations</span>
              </div>
            </div>

            {/* Participation Candidates Table */}
            <div className="extej-card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Candidate Session Records ({participationData.candidates?.length || 0})
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {currentExam?.exam_code}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Register Number</th>
                      <th className="py-3 px-4">Candidate Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Strikes</th>
                      <th className="py-3 px-4">Submission Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(participationData.candidates || []).map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {cand.register_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {cand.student_name}
                        </td>
                        <td className="py-3.5 px-4">
                          {cand.status === 'SUBMITTED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                              SUBMITTED
                            </span>
                          ) : cand.status === 'LOCKED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                              LOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                              IN PROGRESS
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {cand.violations_count || 0}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                          {cand.submission_hash || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
