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
  Check,
  MoreVertical
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
  const [timeFilter, setTimeFilter] = useState('1D');

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
    <DashboardLayout currentPath="/admin" pageTitle="Wallet">
      <div className="space-y-6">
        {/* Page Title - Matching "Wallet" from image */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wallet
          </h1>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>

        {/* Row 1: Top Metrics Cards (Balance, Bitcoin, Ethereum + ADD) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 1: Balance Card (Matching Extej Balance card) */}
          <div className="lg:col-span-5 extej-card p-5 sm:p-6 flex flex-col justify-between relative">
            <div>
              {/* Header with Icon + "Balance" and Currency Dropdown */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center text-slate-400">
                    <span className="text-[10px]">💳</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">Balance</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium cursor-pointer hover:text-slate-600">
                  <span>USD</span>
                  <span className="text-[10px]">▼</span>
                </div>
              </div>

              {/* Big Bold Balance Number */}
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight my-2">
                $1,180,577.24
              </div>

              {/* Multi-segment Colored Bar (BTC orange, ETH blue, USDT green, Other gray) */}
              <div className="h-1.5 w-full rounded-full flex overflow-hidden my-3">
                <div className="bg-[#ff7a1a] w-[45%]" title="BTC (45%)"></div>
                <div className="bg-[#4f86f7] w-[25%]" title="ETH (25%)"></div>
                <div className="bg-[#00c087] w-[20%]" title="USDT (20%)"></div>
                <div className="bg-[#e2e8f0] w-[10%]" title="Other (10%)"></div>
              </div>

              {/* Legend Dots Underneath */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium py-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff7a1a]"></span>
                  <span>BTC</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4f86f7]"></span>
                  <span>ETH</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00c087]"></span>
                  <span>USDT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span>Other</span>
                </div>
              </div>
            </div>

            {/* Profit Today & Trend Indicator */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Profit today</span>
                <span className="text-sm font-bold text-[#00c087]">+$4,245.45</span>
              </div>
              <span className="text-xs font-bold text-[#00c087] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                +14.5%
              </span>
            </div>
          </div>

          {/* Card 2: Bitcoin Card (with Swap, Buy, Send buttons) */}
          <div className="lg:col-span-4 extej-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header with Bitcoin Icon & Dropdown */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#ff7a1a] flex items-center justify-center text-white font-bold text-[10px]">
                    ₿
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Bitcoin</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium cursor-pointer hover:text-slate-600">
                  <span>USD</span>
                  <span className="text-[10px]">▼</span>
                </div>
              </div>

              {/* Big Bold BTC Value & Subtitle */}
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    108,61 BTC
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    $213,017.17
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  1 BTC = $19,509.23
                </div>
              </div>

              {/* Profit Today */}
              <div className="flex items-center justify-between my-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Profit today</span>
                  <span className="font-bold text-[#00c087]">+$1,237.45</span>
                </div>
                <span className="text-[11px] font-bold text-[#00c087] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +5%
                </span>
              </div>
            </div>

            {/* 3 Action Buttons: Swap, Buy (orange), Send (coral/rose) */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => window.location.hash = '#/admin/exams'}
                className="py-2 px-3 rounded-xl bg-orange-100/70 hover:bg-orange-200/70 text-orange-700 text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Swap
              </button>
              <button
                onClick={() => window.location.hash = '#/admin/monitor'}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] hover:from-[#f06a0a] hover:to-[#ff831a] text-white text-xs font-semibold text-center shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                Buy
              </button>
              <button
                onClick={() => window.location.hash = '#/admin/reports'}
                className="py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold text-center shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>

          {/* Card 3: Ethereum Card / Security Status */}
          <div className="lg:col-span-3 extej-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header with Ethereum Icon */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[10px]">
                    Ξ
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Ethereum</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium cursor-pointer hover:text-slate-600">
                  <span>USD</span>
                  <span className="text-[10px]">▼</span>
                </div>
              </div>

              {/* Big Bold ETH Value */}
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  107,45 ETH
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  $31,569.20
                </div>
              </div>

              {/* Profit Today */}
              <div className="flex items-center justify-between my-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Profit today</span>
                  <span className="font-bold text-[#00c087]">+$3,237.10</span>
                </div>
                <span className="text-[11px] font-bold text-[#00c087] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +5%
                </span>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                onClick={() => window.location.hash = '#/admin/exams'}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] text-white text-xs font-semibold text-center shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: "My Wallets" Graph Section (with 1D, 7D, 1M, 3M, 6M, 1Y, ALL) */}
        <div className="extej-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              My Wallets
            </h2>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 sm:gap-2">
              {['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    timeFilter === f
                      ? 'bg-[#ff7a1a] text-white shadow-sm shadow-orange-500/30'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Smooth Area Chart with Orange Wave & Floating Tooltip */}
          <div className="relative w-full h-56 pt-4">
            {/* Floating Tooltip Pill (Matching "My Balance $1,176,356.46 +3.21%") */}
            <div className="absolute right-[22%] top-2 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-1.5 z-10 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium">My Balance</span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <span>$1,176,356.46</span>
                <span className="text-[#00c087] text-[10px] font-bold">+3.21%</span>
              </div>
              {/* Pointer indicator line down */}
              <div className="w-0.5 h-6 bg-blue-400/80 -mb-6 mt-1"></div>
            </div>

            {/* SVG Bezier Area Chart */}
            <svg viewBox="0 0 800 200" className="w-full h-40 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="extejOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7a1a" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area Fill */}
              <path
                d="M0,130 Q100,135 150,110 T250,130 T350,115 T450,120 T550,105 T620,95 L620,200 L0,200 Z"
                fill="url(#extejOrangeGrad)"
              />
              <path
                d="M620,95 Q680,65 740,70 T800,90 L800,200 L620,200 Z"
                fill="url(#extejOrangeGrad)"
              />

              {/* Orange Wave Curve Line */}
              <path
                d="M0,130 Q100,135 150,110 T250,130 T350,115 T450,120 T550,105 T620,95"
                fill="none"
                stroke="#ff7a1a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M620,95 Q680,65 740,70 T800,90"
                fill="none"
                stroke="#ff7a1a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Tooltip dot */}
              <circle cx="620" cy="95" r="4.5" fill="#ffffff" stroke="#4f86f7" strokeWidth="2.5" />
            </svg>

            {/* X-Axis Timestamps (04:00, 09:00, 14:00, 19:00, 00:00) */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 px-2">
              <span>04:00</span>
              <span>09:00</span>
              <span>14:00</span>
              <span>19:00</span>
              <span>00:00</span>
            </div>
          </div>
        </div>

        {/* Row 3: "My Card" Section (with + ADD button and 3 Credit Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              My Card
            </h2>
            <button
              onClick={() => window.location.hash = '#/admin/students'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] text-white text-xs font-semibold shadow-sm shadow-orange-500/25 hover:from-[#f06a0a] hover:to-[#ff831a] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ADD</span>
            </button>
          </div>

          {/* 3 Physical Credit / Admit Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Jordan Belford / Active Checkmark Card */}
            <div className="smart-admit-card p-5 flex flex-col justify-between h-44 relative group hover:shadow-md transition-shadow">
              {/* Top Row: Mastercard circles & Orange Checkmark */}
              <div className="flex items-center justify-between">
                {/* Mastercard Overlapping Circles Logo */}
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-90"></div>
                  <div className="w-6 h-6 rounded-full bg-[#f79e1b] opacity-90"></div>
                </div>
                {/* Orange Circle Checkmark Pill */}
                <div className="w-5 h-5 rounded-full bg-[#ff7a1a] flex items-center justify-center text-white text-[11px] shadow-sm shadow-orange-500/30">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Card Number formatted in 4-digit groups */}
              <div className="text-base sm:text-lg font-mono font-bold tracking-wider text-slate-800 my-2">
                1111 2222 3333 4444
              </div>

              {/* Bottom Row: Card Holder, Expiry, Badge */}
              <div className="flex items-end justify-between text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Card holder</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">JORDAN BELFORD</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Expiry</span>
                  <span className="font-bold text-slate-800">01/23</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px] border border-slate-200">
                    PERSONAL
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Mike Profits Card */}
            <div className="smart-admit-card p-5 flex flex-col justify-between h-44 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-90"></div>
                  <div className="w-6 h-6 rounded-full bg-[#f79e1b] opacity-90"></div>
                </div>
              </div>

              <div className="text-base sm:text-lg font-mono font-bold tracking-wider text-slate-800 my-2">
                4444 3333 2222 1111
              </div>

              <div className="flex items-end justify-between text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Card holder</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">MIKE PROFITS</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Expiry</span>
                  <span className="font-bold text-slate-800">01/23</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px] border border-slate-200">
                    PERSONAL
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Jason Brax Card */}
            <div className="smart-admit-card p-5 flex flex-col justify-between h-44 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-90"></div>
                  <div className="w-6 h-6 rounded-full bg-[#f79e1b] opacity-90"></div>
                </div>
              </div>

              <div className="text-base sm:text-lg font-mono font-bold tracking-wider text-slate-800 my-2">
                1111 2222 3333 4444
              </div>

              <div className="flex items-end justify-between text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Card holder</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">JASON BRAX</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Expiry</span>
                  <span className="font-bold text-slate-800">01/23</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px] border border-slate-200">
                    PERSONAL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Examination Quick Links / System State */}
        <div className="extej-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-bold text-slate-900 text-sm">
                Active Assessment Gateway • 1000 Concurrency Status
              </h3>
            </div>
            <a
              href="#/admin/monitor"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Open Cockpit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Total Candidates</span>
              <span className="text-lg font-black text-slate-800">{stats.totalStudents}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Active Papers</span>
              <span className="text-lg font-black text-slate-800">{stats.totalExams}</span>
            </div>
            <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
              <span className="text-[11px] text-orange-600 block">Live Candidates</span>
              <span className="text-lg font-black text-orange-700">{stats.activeSessions}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block">Pending Appeals</span>
              <span className="text-lg font-black text-slate-800">{stats.pendingResets}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
