import React, { useState, useEffect } from 'react';
import { Maximize2, AlertOctagon, ShieldAlert } from 'lucide-react';

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

  // If exam is active and user is not in fullscreen, block with full-screen security gate
  if (isExamActive && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Fullscreen Mode Required
          </h3>
          <p className="text-sm text-slate-300 mb-6">
            To prevent malpractice and protect question papers, all college exams must be undertaken in forced fullscreen mode. Exiting fullscreen will be logged as a security violation.
          </p>

          <button
            onClick={enterFullscreen}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Maximize2 className="w-5 h-5" />
            Enter Fullscreen & Continue Exam
          </button>
        </div>
      </div>
    );
  }

  return children;
}
