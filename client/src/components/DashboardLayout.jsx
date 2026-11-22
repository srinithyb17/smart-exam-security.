import React, { useState } from 'react';
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
  Mail,
  ChevronRight,
  LogOut,
  Menu,
  X,
  CreditCard,
  Cpu,
  Layers,
  HelpCircle,
  BookOpen,
  Sliders,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DashboardLayout({ children, currentPath = '', pageTitle = 'Dashboard' }) {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Navigation Links for Admin
  const adminNavPages = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, badge: '1' },
    { name: 'Live Proctor', path: '/admin/monitor', icon: Eye, badge: 'Live' },
    { name: 'Exams & Papers', path: '/admin/exams', icon: FileText, badge: '1' },
    { name: 'Candidates', path: '/admin/students', icon: Users, badge: '1' },
    { name: 'Reset Appeals', path: '/admin/resets', icon: RotateCcw, badge: null },
    { name: 'Audit Logs', path: '/admin/security', icon: ShieldAlert, badge: null },
    { name: 'Reports', path: '/admin/reports', icon: BarChart2, badge: null }
  ];

  // Navigation Links for Student
  const studentNavPages = [
    { name: 'My Assessments', path: '/student', icon: LayoutDashboard, badge: '1' },
    { name: 'Completed Papers', path: '/completed', icon: ShieldCheck, badge: null }
  ];

  const currentNav = isAdmin ? adminNavPages : studentNavPages;

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
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 h-18 px-4 sm:px-8 flex items-center justify-between">
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-6 lg:gap-12 flex-1">
          {/* Logo Mark (Polygonal red/orange crystal icon like Extej) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a href={isAdmin ? '#/admin' : '#/student'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff4d2e] via-[#ff6a1a] to-[#ff8f3d] flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
                {/* Geometric polygon mark like uploaded Extej logo */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 tracking-tight">Extej</span>
                <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200">
                  Exam
                </span>
              </div>
            </a>
          </div>

          {/* Search Bar - Pill shape with Q Search placeholder */}
          <div className="hidden md:flex items-center flex-1 max-w-xs relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Q Search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 rounded-full border border-transparent focus:border-orange-400 focus:outline-none transition-all placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Right Section: Notifications, Messages, Profile, Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Notification Bell */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Messages Mail */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
            <Mail className="w-4 h-4" />
          </button>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-orange-600 uppercase">
                {user?.name ? user.name.slice(0, 2) : 'AR'}
              </div>
            </div>

            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Austin Robertson'}
              </div>
              <div className="text-[11px] text-slate-400 leading-none mt-0.5">
                {isAdmin ? 'Marketing Administrator' : (user?.register_number || 'Candidate')}
              </div>
            </div>
          </div>

          {/* Light/Dark Toggle Switch */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-5.5 rounded-full bg-slate-200 p-0.5 flex items-center cursor-pointer transition-colors relative"
            title="Toggle theme"
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4.5 bg-orange-500' : 'translate-x-0'}`}></div>
          </button>

          {/* Institutional / Country Emblem */}
          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600" title="Region / College">
            🇬🇧
          </div>

          {/* Exit / Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex flex-1 relative">
        {/* Left Vertical Sidebar */}
        <aside
          className={`fixed lg:sticky top-18 z-30 h-[calc(100vh-4.5rem)] w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-4 overflow-y-auto transition-transform lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Group 1: PAGES */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
                PAGES
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] text-white shadow-md shadow-orange-500/25'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 ${
                            active ? 'text-white' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Group 2: UI ELEMENTS / CONTROLS */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
                UI ELEMENTS
              </div>
              <div className="space-y-1 text-slate-500 text-xs font-medium">
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Menu Styles</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Tables</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-slate-400" />
                    <span>Charts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Forms</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    <span>Pricing</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span>Modals/Pop-Ups</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3: DOCUMENTATION & SUPPORT */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
                DOCUMENTATION & SUPPORT
              </div>
              <div className="space-y-1 text-slate-500 text-xs font-medium">
                <a
                  href="#/admin"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Documentation</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </a>
                <a
                  href="#/admin"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Support</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Footer / Free Concurrency Capsule */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-orange-800">1000 Capacity Ready</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Zero-cost in-memory SQLite + Brotli optimization active.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-20 lg:hidden"
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
