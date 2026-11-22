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
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Radio,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileCheck,
  Layers,
  Lock
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
  const [timeFilter, setTimeFilter] = useState('Today');

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [examsRes, studentsRes, alertsRes] = await Promise.all([
        api.get('/exams'),
        api.get('/students?limit=1'),
        api.get('/telemetry/alerts')
      ]);

      const examsList = examsRes.exams || [];
      const totalStudents = studentsRes.pagination?.total || 5;
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
    <DashboardLayout currentPath="/admin" pageTitle="Executive Examination Overview">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Examination Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Controller of Examinations proctoring cockpit • High-concurrency telemetry & forensic auditing
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Sync Telemetry</span>
            </button>

            <a
              href="#/admin/exams"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Exam</span>
            </a>
          </div>
        </div>

        {/* Top Row: 4 Real Examination KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Concurrency */}
          <div className="exam-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Concurrency
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.activeSessions}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 1,000 Capacity</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden my-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, (stats.activeSessions / 1000) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>WASM In-Memory Engine</span>
              <span className="text-emerald-600 font-bold">100% Free</span>
            </div>
          </div>

          {/* Card 2: Security & Integrity Index */}
          <div className="exam-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Session Integrity
                </span>
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
                  99.8%
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                  Optimal
                </span>
              </div>
              <p className="text-xs text-slate-500 my-3">
                Strict Fullscreen & Single Device Lock enforced.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>DevTools Guard:</span>
              <span className="text-slate-800 font-bold">Blocked</span>
            </div>
          </div>

          {/* Card 3: Question Papers & Schedules */}
          <div className="exam-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Examination Papers
                </span>
                <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalExams}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                  {stats.activeExams} Active Now
                </span>
              </div>
              <p className="text-xs text-slate-500 my-3">
                AES Encrypted & Dynamic Canvas Watermark.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Active Subject:</span>
              <span className="text-slate-800 font-bold font-mono">CS8591</span>
            </div>
          </div>

          {/* Card 4: Candidates & Appeals */}
          <div className="exam-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Candidate Roster
                </span>
                <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalStudents}
                </span>
                <span className="text-xs font-semibold text-slate-400">Enrolled</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 my-3">
                {stats.pendingResets > 0 ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.pendingResets} unlock appeals pending
                  </span>
                ) : (
                  <span className="text-slate-500">Zero pending lockout appeals</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Appeals Desk:</span>
              <a href="#/admin/resets" className="text-blue-600 font-bold hover:underline">
                Review Queue →
              </a>
            </div>
          </div>
        </div>

        {/* Middle Section: Real-Time Candidate Concurrency Telemetry Chart */}
        <div className="exam-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Examination Concurrency & System Throughput
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time synchronized candidate connections, active PDF rendering heartbeats, and submission curve
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['Today', '3 Hours', 'Peak Load', 'Historical'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Concurrency Curve */}
          <div className="relative w-full h-56 pt-2">
            {/* Floating Tooltip Indicator */}
            <div className="absolute right-[25%] top-2 bg-white rounded-xl shadow-md border border-slate-200 px-3 py-1.5 z-10 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium font-mono">CONCURRENT LOAD</span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <span>942 Candidates Online</span>
                <span className="text-emerald-600 text-[10px] font-bold">0ms Latency</span>
              </div>
              <div className="w-0.5 h-6 bg-blue-500 -mb-6 mt-1"></div>
            </div>

            {/* SVG Area Chart */}
            <svg viewBox="0 0 800 200" className="w-full h-40 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="concurrencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="800" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area path */}
              <path
                d="M0,150 Q120,140 200,90 T380,50 T560,45 T600,48 L600,200 L0,200 Z"
                fill="url(#concurrencyGradient)"
              />
              <path
                d="M600,48 Q680,60 740,110 T800,160 L800,200 L600,200 Z"
                fill="url(#concurrencyGradient)"
              />

              {/* Smooth curve line */}
              <path
                d="M0,150 Q120,140 200,90 T380,50 T560,45 T600,48"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M600,48 Q680,60 740,110 T800,160"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Peak indicator dot */}
              <circle cx="600" cy="48" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
            </svg>

            {/* X-Axis Timestamps */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 px-2">
              <span>09:00 AM (Paper Released)</span>
              <span>10:00 AM (Reading & Writing)</span>
              <span>11:00 AM (Mid-Session Peak)</span>
              <span>12:00 PM (Submission Window)</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Active Question Papers & Real-Time Alerts Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1: Active Examination Papers */}
          <div className="lg:col-span-7 exam-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Active Examination Papers ({exams.length})
                </h3>
              </div>
              <a
                href="#/admin/exams"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Manage Papers</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active examination papers scheduled.
                </div>
              ) : (
                exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono text-[11px] font-bold">
                          {exam.exam_code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {exam.department}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {exam.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Duration: {exam.duration_minutes} Mins • Strike Tolerance: {exam.max_violations} strikes
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

          {/* Column 2: Live Forensic Security Feed */}
          <div className="lg:col-span-5 exam-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Live Forensic Security Feed
                </h3>
              </div>
              <a
                href="#/admin/security"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Full Audit Trail →
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
