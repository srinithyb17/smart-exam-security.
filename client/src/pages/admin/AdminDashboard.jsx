import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Users,
  FileText,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0,
    activeSessions: 0,
    pendingResets: 0,
    recentAlerts: []
  });
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [examsRes, studentsRes, alertsRes] = await Promise.all([
        api.get('/exams'),
        api.get('/students?limit=1'),
        api.get('/telemetry/alerts')
      ]);

      const examsList = examsRes.exams || [];
      const totalStudents = studentsRes.pagination?.total || 0;
      const alerts = alertsRes.alerts || [];

      let activeSessions = 0;
      let pendingResets = 0;
      let activeExamsCount = 0;

      const now = new Date().toISOString();
      examsList.forEach((e) => {
        activeSessions += (e.active_sessions || 0);
        pendingResets += (e.pending_resets || 0);
        if (now >= e.start_time && now <= e.end_time) {
          activeExamsCount++;
        }
      });

      setExams(examsList);
      setStats({
        totalStudents,
        totalExams: examsList.length,
        activeExams: activeExamsCount,
        activeSessions,
        pendingResets,
        recentAlerts: alerts
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => loadDashboardData(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout currentPath="/admin" pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Examination Control Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live proctoring telemetry, candidate tracking, and question paper security overview
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>

            <a
              href="#/admin/exams"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Exam</span>
            </a>
          </div>
        </div>

        {/* Real-Time KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Examinees
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.activeSessions}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Online Now
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Real-time active proctoring sessions
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Live Cockpit:</span>
              <a href="#/admin/monitor" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Monitor Live →
              </a>
            </div>
          </div>

          {/* Card 2: Active Exam Papers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Examination Papers
                </span>
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalExams}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {stats.activeExams} Ongoing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Encrypted question papers configured
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Manage Papers:</span>
              <a href="#/admin/exams" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Schedule →
              </a>
            </div>
          </div>

          {/* Card 3: Unlock Appeals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Unlock Appeals
                </span>
                <span className={`p-1 rounded-md ${stats.pendingResets > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold tracking-tight ${stats.pendingResets > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {stats.pendingResets}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stats.pendingResets > 0 ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {stats.pendingResets > 0 ? 'Action Required' : 'All Clear'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Locked candidates awaiting invigilator review
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Review Queue:</span>
              <a href="#/admin/resets" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Open Queue →
              </a>
            </div>
          </div>

          {/* Card 4: Registered Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Candidate Roster
                </span>
                <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalStudents}
                </span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Registered student credentials
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Directory:</span>
              <a href="#/admin/students" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Manage Students →
              </a>
            </div>
          </div>
        </div>

        {/* Quick Access Action Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-lg font-bold">Live Examination Proctoring Cockpit</h2>
            </div>
            <p className="text-xs text-blue-100 max-w-xl">
              Monitor active candidates in real time. Handle focus violations, manual unlock re-admissions, and emergency submissions with one click.
            </p>
          </div>
          <a
            href="#/admin/monitor"
            className="py-2.5 px-5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Launch Live Cockpit</span>
          </a>
        </div>

        {/* Bottom Section: Active Question Papers & Security Alerts Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Question Papers */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Active Examination Papers ({exams.length})
                </h3>
              </div>
              <a
                href="#/admin/exams"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active examination papers scheduled yet.
                </div>
              ) : (
                exams.slice(0, 4).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono text-[11px] font-bold">
                          {exam.exam_code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {exam.department}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {exam.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Duration: {exam.duration_minutes} Mins • Max Strikes: {exam.max_violations}
                      </p>
                    </div>

                    <a
                      href={`#/admin/monitor?examId=${exam.id}`}
                      className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Cockpit</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Forensic Security Feed */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Recent Security Events
                </h3>
              </div>
              <a
                href="#/admin/security"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Full Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-2.5">
              {stats.recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span>No security violations detected. All candidates operating in clean fullscreen mode.</span>
                </div>
              ) : (
                stats.recentAlerts.slice(0, 5).map((alert, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          {alert.register_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          {alert.event_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {alert.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
