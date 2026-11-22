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
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  Fingerprint
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden bg-grid-pattern">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Academic Gateway Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              SmartExam <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">v2.0</span>
            </span>
            <p className="text-[11px] text-slate-400">Autonomous College Examination Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Server: <strong className="text-slate-200">1000 Concurrency Ready</strong>
          </span>
          <span>•</span>
          <span className="text-slate-400">Encrypted Transport</span>
        </div>
      </header>

      {/* Center Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 shadow-2xl relative border border-slate-800">
            {/* Institution Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Authorized Personnel Gateway</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sign In to Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your institutional credentials to access scheduled exams
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl mb-6 border border-slate-800/80">
              <button
                type="button"
                onClick={() => { setRole('student'); setError(''); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('admin'); setError(''); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Invigilator / Admin</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'student' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Candidate Register Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="e.g. 910021104001"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                    Administrative Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Shield className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs transform hover:-translate-y-0.5 mt-2"
              >
                {loading ? (
                  <span>Authenticating Identity...</span>
                ) : (
                  <>
                    <span>Enter Examination Hall</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Tray */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2.5 text-center">
                Institutional Testing Credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('student')}
                  className="py-2 px-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Student (CSE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin')}
                  className="py-2 px-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chief Invigilator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Trust Footnote */}
          <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
            <p>Protected by Single-Device Session Lock & Dynamic Canvas Watermarking</p>
            <p className="font-mono text-[10px] text-slate-600">ISO/IEC 27001 Standard Academic Security</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        © 2026 SmartExam Security Platform • Engineered for 1,000+ Concurrent College Sessions
      </footer>
    </div>
  );
}
