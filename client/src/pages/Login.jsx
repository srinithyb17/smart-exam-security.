import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  ShieldCheck,
  Lock,
  User,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  Fingerprint,
  Check
} from 'lucide-react';

export default function Login() {
  const { loginAdmin, loginStudent } = useAuth();
  const [role, setRole] = useState('student'); // 'student' or 'admin'
  const [registerNumber, setRegisterNumber] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'student') {
        if (!registerNumber.trim()) throw new Error('Please enter your candidate register number');
        await loginStudent(registerNumber.trim(), password);
        window.location.hash = '#/student';
      } else {
        if (!adminUsername.trim()) throw new Error('Please enter administrative username');
        await loginAdmin(adminUsername.trim(), password);
        window.location.hash = '#/admin';
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type) => {
    setError('');
    if (type === 'student') {
      setRole('student');
      setRegisterNumber('910021104001');
      setPassword('student123');
    } else {
      setRole('admin');
      setAdminUsername('admin');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col justify-between antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff4d2e] via-[#ff6a1a] to-[#ff8f3d] flex items-center justify-center shadow-md shadow-orange-500/25">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">Extej</span>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              Exam Security
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Capacity: <strong className="text-slate-800">1000 Concurrent Free</strong>
          </span>
          <span>•</span>
          <span>WASM In-Memory SQLite</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="extej-card p-8 sm:p-10 shadow-xl border border-slate-200/80">
            {/* Header / Seal */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-orange-50 text-orange-600 mb-3 border border-orange-100 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-[#ff7a1a]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Autonomous College Assessment Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to enter the proctored environment
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setRole('student'); setError(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'student'
                    ? 'bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('admin'); setError(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Invigilator</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'student' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Register Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="e.g. 910021104001"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Admin Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] hover:from-[#f06a0a] hover:to-[#ff831a] text-white text-xs font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Authenticate & Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
                Instant Demo Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('student')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center"
                >
                  Student (910021104001)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center"
                >
                  Admin (admin)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-400 border-t border-slate-200/80 bg-white">
        Smart Examination Security Platform • Free Concurrency 1000 Architecture • Anna University Standard
      </footer>
    </div>
  );
}
