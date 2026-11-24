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
  LogOut,
  Menu,
  X,
  Clock,
  ChevronRight,
  Radio,
  Building2
} from 'lucide-react';

export default function DashboardLayout({ children, currentPath = '', pageTitle = 'Dashboard' }) {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clean, Essential Admin Navigation Links
  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Live Proctoring', path: '/admin/monitor', icon: Eye, live: true },
    { name: 'Exams & Papers', path: '/admin/exams', icon: FileText },
    { name: 'Candidates', path: '/admin/students', icon: Users },
    { name: 'Unlock Appeals', path: '/admin/resets', icon: RotateCcw },
    { name: 'Security Audit', path: '/admin/security', icon: ShieldAlert },
    { name: 'Reports', path: '/admin/reports', icon: BarChart2 }
  ];

  // Clean, Essential Student Navigation Links
  const studentNav = [
    { name: 'My Examinations', path: '/student', icon: LayoutDashboard },
    { name: 'Submission Receipts', path: '/completed', icon: ShieldCheck }
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
      {/* Top Professional Navigation Bar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand Identity & Mobile Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  {isAdmin ? 'COE Portal' : 'Candidate Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Autonomous College Examination Platform
              </p>
            </div>
          </a>
        </div>

        {/* Right: Real-Time Clock, System Status, User Avatar, Exit */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Synchronized Institutional Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-mono font-medium border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentTime}</span>
          </div>

          {/* Real-time Connection Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-[11px]">Live Connected</span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              {isAdmin ? 'COE' : (user?.name ? user.name.charAt(0).toUpperCase() : 'S')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || (isAdmin ? 'Chief Invigilator' : 'Student')}
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
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Framework: Clean Sidebar + Body */}
      <div className="flex flex-1 relative">
        {/* Left Vertical Examination Menu */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-60 bg-white border-r border-slate-200/90 flex flex-col justify-between py-5 px-3 overflow-y-auto transition-transform lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 font-mono">
              {isAdmin ? 'NAVIGATION' : 'EXAMINATION MENU'}
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
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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

          {/* Clean Institutional Footer */}
          <div className="pt-4 border-t border-slate-100 px-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-700 font-semibold block text-[11px] truncate">
                  Autonomous College COE
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Smart Exam Security
                </span>
              </div>
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
