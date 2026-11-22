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
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-lg w-full exam-card p-8 text-center shadow-2xl relative z-10 bg-white">
          {/* Animated Shield Icon */}
          <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-[#ff4d2e] to-[#ff8f3d] flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 mb-3 inline-block">
            Proctoring Requirement
          </span>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            Fullscreen Examination Mode
          </h3>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            To ensure academic integrity, this examination must take place in an isolated full-screen browser session. Exiting fullscreen or navigating away triggers an automatic malpractice strike.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs text-slate-600 space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Browser tab switching detection active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Multi-device single-session lock enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dynamic candidate watermark injected</span>
            </div>
          </div>

          <button
            onClick={enterFullscreen}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9533] hover:from-[#f06a0a] hover:to-[#ff831a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Fullscreen & Access Question Paper</span>
          </button>

          <p className="text-[11px] text-slate-400 mt-4">
            Pressing <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">Esc</kbd> during the exam will record a security violation.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
