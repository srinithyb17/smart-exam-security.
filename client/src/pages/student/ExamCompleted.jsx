import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, ShieldCheck, Home, ArrowRight } from 'lucide-react';

export default function ExamCompleted() {
  const { user } = useAuth();

  useEffect(() => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">
          Examination Submitted!
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          Your exam session has been securely closed and recorded in the college examination server audit log.
        </p>

        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left text-xs space-y-2 mb-6 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Student:</span>
            <span className="text-slate-200 font-bold">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Register No:</span>
            <span className="text-emerald-400 font-bold">{user?.register_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Submission Time:</span>
            <span className="text-slate-200">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Integrity Status:</span>
            <span className="text-blue-400 font-bold">Encrypted & Verified</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Paper access has expired for your session.</span>
        </div>

        <a
          href="#/student"
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </a>
      </div>
    </div>
  );
}
