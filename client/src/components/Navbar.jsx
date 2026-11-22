import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ShieldAlert, LogOut, User, Activity, FileText, Users, Eye, BarChart2 } from 'lucide-react';

export default function Navbar({ currentPath = '' }) {
  const { user, isAdmin, isStudent, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <a href={isAdmin ? '#/admin' : '#/student'} className="font-bold text-lg tracking-tight hover:text-blue-400 transition-colors flex items-center gap-2">
              Smart Exam <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Security</span>
            </a>
            <p className="text-xs text-slate-400">High-Concurrency College Portal</p>
          </div>
        </div>

        {/* Admin Navigation Links */}
        {isAdmin && (
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#/admin"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> Overview
            </a>
            <a
              href="#/admin/monitor"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin/monitor' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" /> Live Monitor
            </a>
            <a
              href="#/admin/exams"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin/exams' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> Exams
            </a>
            <a
              href="#/admin/students"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin/students' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Students
            </a>
            <a
              href="#/admin/security"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin/security' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Security Logs
            </a>
            <a
              href="#/admin/reports"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/admin/reports' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Reports
            </a>
          </nav>
        )}

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none text-slate-200">
              {user.name}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {isAdmin ? 'System Administrator' : `${user.register_number} (${user.department || 'Student'})`}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-colors flex items-center gap-1 text-xs font-medium border border-slate-700/60"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
