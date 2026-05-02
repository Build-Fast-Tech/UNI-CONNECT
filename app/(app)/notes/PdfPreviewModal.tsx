"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface NoteMin {
  title: string;
  file_url: string;
  file_type: string | null;
}

export default function PdfPreviewModal({ note, onClose }: { note: NoteMin; onClose: () => void }) {
  const isPdf = note.file_type?.includes("pdf");
  const [numPages, setNumPages] = useState(0);
  const [pageNum,  setPageNum]  = useState(1);
  const [scale,    setScale]    = useState(1.0);
  const [pdfError, setPdfError] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="font-semibold text-sm flex-1 truncate">{note.title}</p>

        {isPdf && !pdfError && numPages > 0 && (
          <div className="flex items-center gap-1 mr-2">
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[rgb(var(--muted-fg))] w-16 text-center tabular-nums">
              {pageNum} / {numPages}
            </span>
            <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors ml-1">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[rgb(var(--muted-fg))] w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.25))}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}

        <a href={note.file_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0">
          <Download className="w-3.5 h-3.5" /> Download
        </a>
      </div>

      {/* Content */}
      {isPdf && !pdfError ? (
        <div className="flex-1 overflow-auto flex items-start justify-center bg-[rgb(var(--muted)/0.2)] p-6">
          <Document
            file={note.file_url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setPdfError(true)}
            loading={
              <div className="flex flex-col items-center gap-3 pt-24 text-white/60">
                <div className="w-8 h-8 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading PDF…</p>
              </div>
            }
          >
            <Page pageNumber={pageNum} scale={scale} renderTextLayer renderAnnotationLayer />
          </Document>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/70">
          <FileText className="w-14 h-14 opacity-25" />
          <p className="text-base font-semibold text-white/80">{note.title}</p>
          <p className="text-sm">
            {isPdf ? "Could not load PDF." : "In-browser preview isn't available for this file type."}
          </p>
          <a href={note.file_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Open / Download
          </a>
        </div>
      )}
    </div>
  );
}
