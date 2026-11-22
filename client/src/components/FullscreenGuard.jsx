import React, { useState, useEffect } from 'react';
import { Maximize2, ShieldAlert, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

export default function FullscreenGuard({ isExamActive, onFullscreenExit, children }) {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && isExamActive && hasPrompted) {
        onFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [isExamActive, hasPrompted, onFullscreenExit]);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setHasPrompted(true);
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  if (isExamActive && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-lg w-full bg-slate-900/90 border border-blue-500/30 rounded-3xl p-8 text-center shadow-2xl relative z-10 glass-panel-glow">
          {/* Animated Shield Icon */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 border border-blue-400/30">
              <Maximize2 className="w-9 h-9 text-white" />
            </div>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold mb-3 inline-block">
            Proctoring Requirement
          </span>

          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            Fullscreen Examination Mode
          </h3>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            To ensure academic integrity, this examination must take place in an isolated full-screen browser session. Exiting fullscreen or navigating away triggers an automatic malpractice strike.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left text-xs text-slate-400 space-y-2 mb-6 font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Browser tab switching detection active</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-device single-session lock enabled</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dynamic candidate watermark injected</span>
            </div>
          </div>

          <button
            onClick={enterFullscreen}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Fullscreen & Access Question Paper</span>
          </button>

          <p className="text-[11px] text-slate-500 mt-4">
            Pressing <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono text-[10px]">Esc</kbd> during the exam will trigger a security violation report.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
