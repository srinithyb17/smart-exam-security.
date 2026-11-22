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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 sm:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">SmartExam</span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Security v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous College Examination Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Capacity: <strong className="text-slate-800">1,000 Concurrent Free</strong>
          </span>
          <span>•</span>
          <span>WASM In-Memory SQLite</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="exam-card p-8 sm:p-10 shadow-lg border border-slate-200/90">
            {/* Header / Seal */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-100 shadow-xs">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Secure Assessment Gateway
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your authorized credentials to access proctored examination papers
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setRole('student'); setError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('admin'); setError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Invigilator / COE</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Candidate Register Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="e.g. 910021104001"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Invigilator / Administrator Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Authenticate & Access Examination</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wider font-mono">
                One-Click Quick Evaluation Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('student')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center"
                >
                  Candidate (910021104001)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin')}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center"
                >
                  Admin / COE (admin)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-500 border-t border-slate-200/80 bg-white">
        Smart Examination Security Platform • High-Concurrency 1,000 Architecture • Anna University Affiliated College Standard
      </footer>
    </div>
  );
}
