import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import WatermarkOverlay from './WatermarkOverlay';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Shield, AlertTriangle, Loader2 } from 'lucide-react';

// Setup worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization error:', e);
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
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          throw new Error(errData.error || `Failed to fetch paper: Status ${res.status}`);
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

  // Render current page to Canvas
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
        canvas.height = viewport.height;
        canvas.width = viewport.width;

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

  // Zoom Handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => setScale(1.2);

  // Page Handlers
  const handlePrevPage = () => setPageNum((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNum((prev) => Math.min(prev + 1, totalPages));

  // Security handlers: block right click & print screen
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onViolation) onViolation('RIGHT_CLICK_ATTEMPT', 'Right-click context menu prohibited');
    return false;
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none"
    >
      {/* Viewer Control Toolbar */}
      <div className="bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure Canvas Mode</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Direct download & printing disabled
          </span>
        </div>

        {/* Page and Zoom Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handlePrevPage}
              disabled={pageNum <= 1 || loading}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-2 text-slate-200">
              Page {pageNum} of {totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageNum >= totalPages || loading}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.7}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-1.5 text-slate-300 min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={loading || scale >= 2.4}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Display Area with Dynamic Watermarking */}
      <div className="relative flex-1 overflow-auto bg-slate-950 p-4 md:p-8 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Decrypting and streaming question paper...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md bg-red-950/40 border border-red-500/40 rounded-xl p-6 text-center text-red-300">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h4 className="font-semibold text-base mb-1 text-white">Protected Access Denied</h4>
            <p className="text-xs text-red-300 mb-4">{error}</p>
            <p className="text-[11px] text-slate-400">
              Only authenticated students during the active scheduled exam window can view this paper.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="relative inline-block shadow-2xl rounded-sm border border-slate-700 bg-white">
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
