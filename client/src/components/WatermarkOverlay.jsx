import React, { useState, useEffect } from 'react';

export default function WatermarkOverlay({ registerNumber = 'STUDENT', examCode = 'EXAM', studentName = '' }) {
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate repeating watermark cells
  const cells = Array.from({ length: 48 });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none"
      style={{ userSelect: 'none' }}
    >
      <div className="w-full h-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 p-6 opacity-[0.14] rotate-[-22deg] scale-110">
        {cells.map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center font-mono text-center">
            <span className="text-sm font-black tracking-widest text-slate-900 uppercase">
              {registerNumber}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {examCode} • {timestamp}
            </span>
            {studentName && (
              <span className="text-[10px] text-slate-700 truncate max-w-[140px]">
                {studentName}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
