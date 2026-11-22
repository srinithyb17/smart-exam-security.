import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Eye,
  FileText,
  Users,
  ShieldAlert,
  RotateCcw,
  BarChart2,
  ShieldCheck,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Clock,
  Wifi,
  Lock,
  Cpu,
  Shield,
  GraduationCap
} from 'lucide-react';

export default function DashboardLayout({ children, currentPath = '', pageTitle = 'Executive Overview' }) {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin Navigation Links
  const adminNav = [
    { name: 'Executive Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Live Proctor Cockpit', path: '/admin/monitor', icon: Eye, live: true },
    { name: 'Exams & Question Papers', path: '/admin/exams', icon: FileText },
    { name: 'Candidate Directory', path: '/admin/students', icon: Users },
    { name: 'Unlock Appeals Queue', path: '/admin/resets', icon: RotateCcw },
    { name: 'Security Audit Logs', path: '/admin/security', icon: ShieldAlert },
    { name: 'Official Reports & CSV', path: '/admin/reports', icon: BarChart2 }
  ];

  // Student Navigation Links
  const studentNav = [
    { name: 'My Examination Schedule', path: '/student', icon: LayoutDashboard },
    { name: 'Verified Receipts', path: '/completed', icon: ShieldCheck }
  ];

  const currentNav = isAdmin ? adminNav : studentNav;

  const isActive = (itemPath) => {
    if (itemPath === '/admin' && (currentPath === '/admin' || currentPath === '/' || currentPath === '')) {
      return true;
    }
    if (itemPath === '/student' && (currentPath === '/student' || currentPath === '/' || currentPath === '')) {
      return true;
    }
    return currentPath === itemPath;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand Identity & Mobile Hamburger */}
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href={isAdmin ? '#/admin' : '#/student'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  SmartExam
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide hidden sm:inline-block">
                  Security Gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Autonomous College Examination Platform
              </p>
            </div>
          </a>

          {/* Quick Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-sm relative ml-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate register no, exam code, forensic events..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Right: Live Clock, 1,000 Capacity Status, User Avatar, Exit */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Synchronized College Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-mono font-medium border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentTime}</span>
          </div>

          {/* Concurrency Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold">1,000 Seats Ready</span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {isAdmin ? 'COE' : (user?.name ? user.name.charAt(0).toUpperCase() : 'S')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Chief Invigilator'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {isAdmin ? 'Controller of Examinations' : user?.register_number}
              </p>
            </div>
          </div>

          {/* Exit / Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Terminate Session / Exit"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Framework: Sidebar + Body */}
      <div className="flex flex-1 relative">
        {/* Left Vertical Examination Menu */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between py-5 px-3 overflow-y-auto transition-transform lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Section 1: EXAMINATION OPERATIONS */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2 font-mono">
                {isAdmin ? 'EXAMINATION OPERATIONS' : 'CANDIDATE PORTAL'}
              </div>
              <nav className="space-y-1">
                {currentNav.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.path}
                      href={`#${item.path}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.live && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Section 2: PROCTORING SECURITY ENFORCEMENT */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2 font-mono">
                SECURITY ENFORCEMENT
              </div>
              <div className="space-y-2 px-2 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 text-[11px] font-medium">Fullscreen Enforcer</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 text-[11px] font-medium">Single-Device Lock</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    LOCKED
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 text-[11px] font-medium">Dynamic Watermark</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                    INJECTED
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: ARCHITECTURE SPECS */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2 font-mono">
                ENGINE STATUS
              </div>
              <div className="space-y-1.5 px-3 text-[11px] text-slate-500 font-mono">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <strong className="text-slate-700">WASM SQLite</strong>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <strong className="text-emerald-600">1,000 Students</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hosting Cost:</span>
                  <strong className="text-blue-600">$0.00 / Free</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Badge Footer */}
          <div className="pt-4 border-t border-slate-100 px-2">
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-blue-800 block">
                Anna University Regulation
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Smart Exam Security Platform v2.0
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 lg:hidden"
          ></div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
