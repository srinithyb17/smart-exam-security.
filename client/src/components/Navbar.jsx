import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Activity,
  FileText,
  Users,
  Eye,
  BarChart2,
  Clock,
  Wifi,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ currentPath = '' }) {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white sticky top-0 z-40 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Crest */}
        <div className="flex items-center gap-3">
          <a
            href={isAdmin ? '#/admin' : '#/student'}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all transform group-hover:scale-105">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  SmartExam
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold hidden sm:inline-block">
                  Enterprise Security
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span>College Assessment Gateway</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                  <Wifi className="w-2.5 h-2.5" /> High-Concurrency 1000
                </span>
              </p>
            </div>
          </a>
        </div>

        {/* Admin Navigation Pills */}
        {isAdmin && (
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
            <a
              href="#/admin"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </a>

            <a
              href="#/admin/monitor"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin/monitor'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Cockpit</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </a>

            <a
              href="#/admin/exams"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin/exams'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exams & Papers</span>
            </a>

            <a
              href="#/admin/students"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin/students'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidates</span>
            </a>

            <a
              href="#/admin/security"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin/security'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Audit Logs</span>
            </a>

            <a
              href="#/admin/reports"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentPath === '/admin/reports'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </a>
          </nav>
        )}

        {/* Right Section: Live Time, User Badge & Logout */}
        <div className="flex items-center gap-3">
          {/* Synchronized System Clock */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime}</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 py-1 px-3 rounded-2xl">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700/60">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[120px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isAdmin ? 'System Administrator' : user.register_number}
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 hover:text-red-400 hover:border-red-500/40 text-slate-400 border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold group cursor-pointer"
            title="Terminate Session / Logout"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
