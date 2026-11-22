import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
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
  Upload,
  RefreshCw,
  ExternalLink
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
      examsList.forEach(e => {
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
    const interval = setInterval(() => loadDashboardData(), 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentPath="/admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Administration Control Center
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Live examination control, anti-malpractice monitoring & student management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="#/admin/exams"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Exam</span>
            </a>
            <a
              href="#/admin/students"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload</span>
            </a>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Enrolled</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
              {stats.totalStudents}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Students in College DB</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Live Active Sessions</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono flex items-center gap-2">
              {stats.activeSessions}
              {stats.activeSessions > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Students Taking Exams Now</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Pending Resets</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 font-mono">
              {stats.pendingResets}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              <a href="#/admin/resets" className="text-amber-400 hover:underline">
                Awaiting Invigilator Review →
              </a>
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Scheduled Exams</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
              {stats.totalExams}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">{stats.activeExams} active right now</span>
          </div>
        </div>

        {/* Two-Column Grid: Active Exams and Live Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active / Scheduled Exams (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Examinations Overview
              </h2>
              <a href="#/admin/exams" className="text-xs text-blue-400 hover:underline">
                View All Exams →
              </a>
            </div>

            {exams.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
                <p className="text-sm">No exams created yet.</p>
                <a
                  href="#/admin/exams"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 rounded-xl text-xs font-semibold text-white"
                >
                  Create First Exam
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                          {exam.exam_code}
                        </span>
                        <h3 className="font-bold text-white text-base">{exam.title}</h3>
                      </div>
                      <span className="text-xs font-medium text-slate-400 font-mono">
                        {exam.duration_minutes} Mins
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-slate-800/80 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Active</span>
                        <span className="font-bold text-emerald-400">{exam.active_sessions || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Submitted</span>
                        <span className="font-bold text-blue-400">{exam.submitted_sessions || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Locked</span>
                        <span className="font-bold text-red-400">{exam.locked_sessions || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Resets</span>
                        <span className="font-bold text-amber-400">{exam.pending_resets || 0}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[200px]">
                        Subject: <strong className="text-slate-200">{exam.subject}</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={`#/admin/monitor?examId=${exam.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Monitor Live</span>
                        </a>
                        <a
                          href={`#/admin/reports?examId=${exam.id}`}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          Reports →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-Time Security Alerts Feed (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                Live Security Feed
              </h2>
              <a href="#/admin/security" className="text-xs text-red-400 hover:underline">
                Full Logs →
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 max-h-[480px] overflow-y-auto">
              {stats.recentAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                  No high-severity security incidents detected.
                </div>
              ) : (
                stats.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-slate-700 transition text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {alert.event_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-slate-200 font-medium mt-1">
                      {alert.student_name} (<span className="font-mono">{alert.register_number}</span>)
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                      {alert.details}
                    </p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Exam: {alert.exam_title || 'General'}</span>
                      <span>IP: {alert.ip_address}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
