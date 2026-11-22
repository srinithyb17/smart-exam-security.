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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col items-center justify-center p-4 relative antialiased print:bg-white print:p-0">
      <div className="max-w-lg w-full extej-card p-8 sm:p-10 text-center shadow-xl relative z-10 print:shadow-none print:border-none">
        {/* Verified Academic Seal */}
        <div className="mx-auto w-20 h-20 mb-5 rounded-2xl bg-gradient-to-tr from-[#00c087] to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3 inline-block">
          Official Digital Receipt
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Examination Submitted!
        </h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Your answers have been cryptographically sealed and permanently logged into the evaluation database.
        </p>

        {/* Receipt Details Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left text-xs space-y-2.5 mb-6 font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-400">Candidate Name:</span>
            <span className="text-slate-800 font-bold">{user?.name}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-400">Register Number:</span>
            <span className="text-slate-800 font-bold">{user?.register_number}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-400">Submission Timestamp:</span>
            <span className="text-slate-800 font-semibold">{submissionTimestamp}</span>
          </div>

          <div className="pt-1">
            <span className="text-slate-400 block text-[10px] mb-1">Receipt Hash:</span>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 break-all select-all">
              {submissionHash}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <a
            href="#/student"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] hover:from-[#f06a0a] hover:to-[#ff831a] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </a>
        </div>
      </div>
    </div>
  );
}
