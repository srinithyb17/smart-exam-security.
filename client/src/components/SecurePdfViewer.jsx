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
        if (!isMounted) return;

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/cmaps/',
          cMapPacked: true
        });

        const loadedPdf = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Secure PDF Loader Error:', err);
          setError(err.message || 'Unable to load encrypted question paper.');
          setLoading(false);
        }
      }
    };

    fetchPaper();
    return () => {
      isMounted = false;
    };
  }, [examId]);

  // Render current page onto canvas
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
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('PDF Page render error:', err);
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

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.75));
  };

  const handleResetZoom = () => {
    setScale(1.25);
  };

  // Prevent Right-Click on paper
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onViolation) {
      onViolation('RIGHT_CLICK_ATTEMPT', 'Context menu access blocked on question paper canvas');
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="flex flex-col flex-1 h-full w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md relative"
    >
      {/* Floating Toolbar Dock */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">Secure Canvas Protected</span>
          <span className="text-slate-300">•</span>
          <span>Download & Print Guard Active</span>
        </div>

        {/* Page & Zoom Navigation Dock */}
        <div className="flex items-center gap-3">
          {/* Page Jumper */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevPage}
              disabled={pageNum <= 1 || loading}
              className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs font-mono font-bold px-1 text-slate-800">
              <span>Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                className="w-8 py-0.5 text-center bg-white border border-slate-200 rounded text-blue-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-400">/ {totalPages || 1}</span>
            </form>

            <button
              onClick={handleNextPage}
              disabled={pageNum >= totalPages || loading}
              className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.7}
              className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold px-2 text-slate-700 min-w-[48px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={loading || scale >= 2.6}
              className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 overflow-auto bg-[#f8fafc] p-4 sm:p-8 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-20">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700">
              Streaming & Decrypting Question Paper...
            </p>
            <p className="text-xs text-slate-400">
              Enforcing Candidate Watermarking Matrix
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md bg-white border border-rose-200 rounded-2xl p-8 text-center text-rose-600 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-rose-500" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-1">Access Restricted</h4>
            <p className="text-xs text-slate-500 mb-3">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="relative inline-block shadow-2xl rounded-lg border border-slate-300 bg-white">
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
