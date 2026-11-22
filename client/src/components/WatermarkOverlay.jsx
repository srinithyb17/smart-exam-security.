import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

export default function WatermarkOverlay({
  registerNumber = 'CANDIDATE',
  examCode = 'EXAM',
  studentName = ''
}) {
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dense diagonal grid matrix
  const cells = Array.from({ length: 40 });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none"
      style={{ userSelect: 'none' }}
    >
      <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-8 p-6 opacity-[0.14] rotate-[-24deg] scale-110">
        {cells.map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center font-mono text-center p-2 border border-slate-900/30 rounded-lg"
          >
            <div className="flex items-center gap-1 text-[11px] font-black tracking-widest text-slate-950 uppercase">
              <Shield className="w-2.5 h-2.5 text-slate-950 inline" />
              <span>{registerNumber}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-900">
              {examCode} • {timestamp}
            </div>
            {studentName && (
              <div className="text-[9px] text-slate-800 font-medium truncate max-w-[150px]">
                {studentName}
              </div>
            )}
            <div className="text-[8px] text-slate-700 tracking-tighter uppercase font-semibold">
              OFFICIAL SECURE ASSESSMENT
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
