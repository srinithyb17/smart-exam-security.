import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import WatermarkOverlay from './WatermarkOverlay';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  FileText,
  Lock,
  Maximize2
} from 'lucide-react';

// Setup worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export default function SecurePdfViewer({
  examId,
  studentRegisterNumber = 'STUDENT',
  examCode = 'EXAM',
  studentName = '',
  onViolation
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInput, setPageInput] = useState('1');

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Fetch PDF as ArrayBuffer using auth token
  useEffect(() => {
    let isMounted = true;
    const fetchPaper = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('smart_exam_token');
        const res = await fetch(`/api/exams/${examId}/paper`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Access denied: Status ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setPageNum(1);
          setPageInput('1');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading question paper PDF:', err);
          setError(err.message || 'Could not load question paper. Please verify exam schedule or session status.');
          setLoading(false);
        }
      }
    };

    fetchPaper();
    return () => {
      isMounted = false;
    };
  }, [examId]);

  // Render current page to Canvas with Retina / High-DPI support
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.height = viewport.height * pixelRatio;
        canvas.width = viewport.width * pixelRatio;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  // Page navigation handlers
  const handlePrevPage = () => {
    if (pageNum > 1) {
      const next = pageNum - 1;
      setPageNum(next);
      setPageInput(next.toString());
    }
  };

  const handleNextPage = () => {
    if (pageNum < totalPages) {
      const next = pageNum + 1;
      setPageNum(next);
      setPageInput(next.toString());
    }
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setPageNum(parsed);
    } else {
      setPageInput(pageNum.toString());
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.6));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => setScale(1.25);

  // Security handlers
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onViolation) onViolation('RIGHT_CLICK_ATTEMPT', 'Right-click context menu prohibited');
    return false;
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="flex flex-col h-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none"
    >
      {/* Top Floating Glassmorphism Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-slate-300 z-10 shadow-lg">
        {/* Status Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-xl text-xs font-semibold shadow-inner">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure Canvas Stream</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
            • Direct Download Blocked
          </span>
        </div>

        {/* Page & Zoom Navigation Dock */}
        <div className="flex items-center gap-3">
          {/* Page Jumper */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevPage}
              disabled={pageNum <= 1 || loading}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs font-mono font-bold px-1 text-slate-200">
              <span>Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                className="w-8 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-blue-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-500">/ {totalPages || 1}</span>
            </form>

            <button
              onClick={handleNextPage}
              disabled={pageNum >= totalPages || loading}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.7}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold px-2 text-slate-300 min-w-[48px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={loading || scale >= 2.6}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
              <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Streaming & Decrypting Question Paper...
            </p>
            <p className="text-xs font-mono text-slate-500">
              Enforcing Candidate Watermarking Matrix
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md bg-red-950/40 border border-red-500/40 rounded-3xl p-8 text-center text-red-300 glass-panel shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-2">Access Restricted</h4>
            <p className="text-xs text-red-300 mb-4 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
              Only authenticated candidates during active examination hours with authorized session tokens can decrypt this question paper.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="relative inline-block shadow-2xl rounded-sm border border-slate-700/80 bg-white">
            {/* The Raw Rendered PDF Canvas */}
            <canvas
              ref={canvasRef}
              className="block pointer-events-none"
              style={{ maxWidth: '100%' }}
            />

            {/* Dynamic Real-Time Repeating Watermark Layer */}
            <WatermarkOverlay
              registerNumber={studentRegisterNumber}
              examCode={examCode}
              studentName={studentName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
