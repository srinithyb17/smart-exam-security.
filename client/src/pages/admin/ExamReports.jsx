import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
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

  const handleExportCSV = () => {
    if (!selectedExamId) return;
    window.location.href = `/api/reports/exam/${selectedExamId}/export-csv`;
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = participationData?.summary || {};
  const exam = participationData?.exam || {};
  const studentSessions = participationData?.studentSessions || [];
  const eventBreakdown = securityData?.eventBreakdown || [];
  const topViolators = securityData?.topViolators || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar currentPath="/admin/reports" />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Examination Assessment Reports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Official Assessment Audit
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Candidate participation forensics, malpractice distributions, submission timestamps & tamper-evident logs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-lg"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_code} - {ex.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        {/* Institutional Formal Header / Letterhead */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-xl print:border-gray-400 print:bg-white print:p-0 print:shadow-none print:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 print:border-gray-300">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 print:text-blue-700 font-bold block mb-1">
                INSTITUTIONAL EXAMINATION COUNCIL • AUDIT DOSSIER
              </span>
              <h2 className="text-2xl font-black text-white print:text-black tracking-tight">
                {exam.title || 'Examination Assessment Report'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 print:text-gray-700 font-mono mt-1">
                Course Code: <strong className="text-white print:text-black">{exam.exam_code}</strong> • Subject: <strong className="text-white print:text-black">{exam.subject}</strong> • Duration: <strong className="text-white print:text-black">{exam.duration_minutes} Mins</strong>
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-400 print:text-gray-600">
              <span className="block text-[11px]">System: SmartExam Security Engine</span>
              <span className="block text-[11px] mt-0.5">Report Date: {new Date().toLocaleDateString()}</span>
              <span className="block text-[11px] text-emerald-400 print:text-green-700 font-bold mt-0.5">
                Status: Audit Authenticated
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              Compiling assessment statistics...
            </div>
          ) : (
            <>
              {/* Metric Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 my-6">
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">Enrolled</span>
                  <span className="text-2xl font-black text-white print:text-black font-mono mt-1 block">
                    {summary.total_registered_students || 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">Attended</span>
                  <span className="text-2xl font-black text-blue-400 print:text-blue-700 font-mono mt-1 block">
                    {summary.total_started || 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">Submitted</span>
                  <span className="text-2xl font-black text-emerald-400 print:text-green-700 font-mono mt-1 block">
                    {summary.total_submitted || 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">In Progress</span>
                  <span className="text-2xl font-black text-amber-400 print:text-amber-700 font-mono mt-1 block">
                    {summary.total_in_progress || 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">Interrupted</span>
                  <span className="text-2xl font-black text-orange-400 print:text-orange-700 font-mono mt-1 block">
                    {summary.total_interrupted || 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono font-bold block">Suspended</span>
                  <span className="text-2xl font-black text-red-400 print:text-red-700 font-mono mt-1 block">
                    {summary.total_locked || 0}
                  </span>
                </div>
              </div>

              {/* Security Forensics & Violations Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* Event Distribution */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl print:border-gray-300 print:bg-gray-50">
                  <h3 className="font-bold text-white print:text-black text-xs uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Malpractice Incidents by Category</span>
                  </h3>

                  {eventBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Zero security violations recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {eventBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900/80 print:bg-white border border-slate-800/80">
                          <span className="font-mono text-slate-200 print:text-black font-semibold">{item.event_type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{item.severity}</span>
                            <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flagged Candidates */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl print:border-gray-300 print:bg-gray-50">
                  <h3 className="font-bold text-white print:text-black text-xs uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Candidates Flagged for Telemetry Strikes</span>
                  </h3>

                  {topViolators.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">All candidates adhered to examination code of conduct.</p>
                  ) : (
                    <div className="space-y-2">
                      {topViolators.map((st, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900/80 print:bg-white border border-slate-800/80">
                          <div>
                            <span className="font-bold text-white print:text-black">{st.student_name}</span>
                            <span className="text-slate-400 font-mono text-[11px] block">{st.register_number} ({st.department})</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                              {st.violations_count} Strikes
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Candidate Attendance & Submission Ledger */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden mt-6 print:border-gray-300 print:bg-white">
                <div className="p-4 border-b border-slate-800 print:border-gray-300">
                  <h3 className="font-bold text-white print:text-black text-xs uppercase font-mono tracking-wider">
                    Candidate Roster & Submission Audit Ledger
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-700 font-mono uppercase tracking-wider border-b border-slate-800/80 print:border-gray-300">
                      <tr>
                        <th className="py-3 px-3">Register No</th>
                        <th className="py-3 px-3">Candidate Name</th>
                        <th className="py-3 px-3">Dept</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Strikes</th>
                        <th className="py-3 px-3">Start Time</th>
                        <th className="py-3 px-3">Submission Time</th>
                        <th className="py-3 px-3 text-right">Terminal IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 font-sans">
                      {studentSessions.map((st, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-white print:text-black">
                            {st.register_number}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-gray-800">
                            {st.student_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 print:text-gray-600">
                            {st.department}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                                st.status === 'SUBMITTED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : st.status === 'LOCKED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                  : st.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : st.status === 'INTERRUPTED'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={st.violations_count > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                              {st.violations_count || 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 print:text-gray-600 text-[11px]">
                            {st.start_time ? new Date(st.start_time).toLocaleTimeString() : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 print:text-gray-600 text-[11px]">
                            {st.end_time ? new Date(st.end_time).toLocaleTimeString() : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                            {st.ip_address || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
