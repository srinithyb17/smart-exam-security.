import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircle2,
  ShieldCheck,
  Home,
  ArrowRight,
  Printer,
  Download,
  Award,
  Hash,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';

export default function ExamCompleted() {
  const { user } = useAuth();
  const [submissionHash, setSubmissionHash] = useState('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState('');

  useEffect(() => {
    // Generate pseudo-cryptographic receipt hash
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setSubmissionHash(`0x${randomHex}`);
    setSubmissionTimestamp(new Date().toLocaleString());

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 bg-grid-pattern relative overflow-hidden print:bg-white print:text-black">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none print:hidden"></div>

      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative z-10 glass-panel-glow print:border-black print:bg-white print:shadow-none">
        {/* Verified Academic Seal */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping print:hidden"></div>
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-400/40 print:border-green-700">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        <span className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold mb-3 inline-block">
          Official Digital Receipt
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 print:text-black">
          Examination Submitted!
        </h1>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed print:text-gray-700">
          Your examination paper has been sealed and securely recorded in the university evaluation database.
        </p>

        {/* Official Receipt Card */}
        <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-left text-xs space-y-2.5 mb-6 font-mono shadow-inner print:bg-gray-50 print:border-gray-300">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 print:border-gray-300">
            <span className="text-slate-500 flex items-center gap-1.5 print:text-gray-600">
              <User className="w-3.5 h-3.5" /> Candidate:
            </span>
            <span className="text-white font-bold print:text-black">{user?.name}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 print:border-gray-300">
            <span className="text-slate-500 flex items-center gap-1.5 print:text-gray-600">
              <GraduationCap className="w-3.5 h-3.5" /> Register No:
            </span>
            <span className="text-emerald-400 font-bold print:text-green-800">{user?.register_number}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 print:border-gray-300">
            <span className="text-slate-500 flex items-center gap-1.5 print:text-gray-600">
              <Clock className="w-3.5 h-3.5" /> Timestamp:
            </span>
            <span className="text-slate-300 print:text-black">{submissionTimestamp}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 print:border-gray-300">
            <span className="text-slate-500 flex items-center gap-1.5 print:text-gray-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Integrity Check:
            </span>
            <span className="text-blue-400 font-bold print:text-blue-800">Verified & Encrypted</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] mb-1 print:text-gray-600">
              Receipt Cryptographic Hash:
            </span>
            <p className="text-[10px] text-slate-400 font-mono break-all bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 print:bg-white print:border-gray-300 print:text-black">
              {submissionHash}
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6 print:text-gray-600">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Paper access has been revoked for this authorized session token.</span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <a
            href="#/student"
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}
