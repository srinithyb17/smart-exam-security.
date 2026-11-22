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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Radio,
  Sparkles
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
    const interval = setInterval(() => loadDashboardData(), 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern">
      <Navbar currentPath="/admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Banner & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Controller of Examinations Cockpit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Overview
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Live student proctoring, anti-malpractice forensics & examination scheduling
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            <a
              href="#/admin/exams"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Exam</span>
            </a>
            <a
              href="#/admin/students"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Batch Upload</span>
            </a>
          </div>
        </div>

        {/* Executive KPI Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Total Enrolled</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-3 font-mono tracking-tight">
              {stats.totalStudents}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Candidates in College DB</span>
          </div>

          <div className="glass-panel-glow rounded-3xl p-6 border border-emerald-500/30 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Active Sessions
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-3 font-mono tracking-tight">
              {stats.activeSessions}
            </p>
            <span className="text-[11px] text-emerald-500/80 mt-1 block font-mono">
              <a href="#/admin/monitor" className="hover:underline flex items-center gap-1">
                Open Live Cockpit <ChevronRight className="w-3 h-3" />
              </a>
            </span>
          </div>

          <div className={`glass-panel rounded-3xl p-6 border shadow-xl relative overflow-hidden group ${
            stats.pendingResets > 0 ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">Pending Appeals</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-400 mt-3 font-mono tracking-tight">
              {stats.pendingResets}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
              <a href="#/admin/resets" className="text-amber-400 hover:underline flex items-center gap-1">
                Review Student Appeals <ChevronRight className="w-3 h-3" />
              </a>
            </span>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Scheduled Exams</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-3 font-mono tracking-tight">
              {stats.totalExams}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block font-mono">
              {stats.activeExams} Active right now
            </span>
          </div>
        </div>

        {/* Two-Column Section: Active Exams & Live Forensics Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active / Scheduled Exams (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Examinations Summary</span>
              </h2>
              <a href="#/admin/exams" className="text-xs text-blue-400 hover:underline font-semibold font-mono">
                View All Timetables →
              </a>
            </div>

            {exams.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center text-slate-400">
                <p className="text-sm">No exams scheduled yet.</p>
                <a
                  href="#/admin/exams"
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white"
                >
                  Create Examination
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="glass-panel rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                          {exam.exam_code}
                        </span>
                        <h3 className="font-bold text-white text-base">{exam.title}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {exam.duration_minutes} Mins
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-slate-800/80 text-xs font-mono">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px] uppercase">Active Now</span>
                        <span className="font-bold text-emerald-400 text-sm">{exam.active_sessions || 0}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px] uppercase">Submitted</span>
                        <span className="font-bold text-blue-400 text-sm">{exam.submitted_sessions || 0}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px] uppercase">Suspended</span>
                        <span className="font-bold text-red-400 text-sm">{exam.locked_sessions || 0}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px] uppercase">Appeals</span>
                        <span className="font-bold text-amber-400 text-sm">{exam.pending_resets || 0}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[220px]">
                        Subject: <strong className="text-slate-200">{exam.subject}</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={`#/admin/monitor?examId=${exam.id}`}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 font-mono"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Monitor Live</span>
                        </a>
                        <a
                          href={`#/admin/reports?examId=${exam.id}`}
                          className="text-slate-400 hover:text-slate-200 font-mono"
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

          {/* Real-Time Malpractice Radar Feed (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Live Security Radar</span>
              </h2>
              <a href="#/admin/security" className="text-xs text-red-400 hover:underline font-semibold font-mono">
                Full Forensics →
              </a>
            </div>

            <div className="glass-panel rounded-3xl p-4 border border-slate-800 shadow-xl space-y-2.5 max-h-[500px] overflow-y-auto">
              {stats.recentAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
                  No high-severity security incidents detected.
                </div>
              ) : (
                stats.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
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

                    <p className="text-slate-200 font-semibold mt-1">
                      {alert.student_name} (<span className="font-mono text-blue-400">{alert.register_number}</span>)
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                      {alert.details}
                    </p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-900 pt-1.5">
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
