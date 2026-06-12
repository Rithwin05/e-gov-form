"use client";

import React from "react";
import { AlertCircle, FileText, RefreshCcw } from "lucide-react";

interface FormPreviewProps {
  pdfBlobUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  onRegenerate?: () => void;
}

export function FormPreview({
  pdfBlobUrl,
  isGenerating,
  error,
  onRegenerate,
}: FormPreviewProps) {
  return (
    <div className="space-y-4">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Document Preview
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Review your filled Aadhaar certificate below. Click{" "}
            <strong className="text-emerald-400">Download PDF</strong> when
            you&apos;re satisfied with the details.
          </p>
        </div>

        {/* Re-generate button (only when we already have a PDF) */}
        {pdfBlobUrl && !isGenerating && onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       border-slate-600 bg-slate-800 text-slate-300 hover:text-white
                       hover:border-slate-400 text-xs font-medium transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Re-generate
          </button>
        )}
      </div>

      {/* ── PDF Viewer ────────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden"
        style={{ height: "75vh", minHeight: "520px" }}
      >
        {/* Loading spinner */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-slate-900/95">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Generating your certificate…</p>
              <p className="text-slate-400 text-sm mt-1">This usually takes 1–2 seconds</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isGenerating && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-700/50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-white font-semibold text-base">Failed to generate preview</p>
              <p className="text-slate-400 text-sm mt-2 break-words">{error}</p>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg
                             bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── The actual PDF iframe ─────────────────────────────────────── */}
        {!isGenerating && !error && pdfBlobUrl && (
          <iframe
            key={pdfBlobUrl}          /* remount when URL changes */
            src={pdfBlobUrl}
            className="w-full h-full border-0"
            title="Aadhaar Certificate Preview"
          />
        )}

        {/* Placeholder before first generation */}
        {!isGenerating && !error && !pdfBlobUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-600 text-sm animate-pulse">
              Preparing your document…
            </p>
          </div>
        )}
      </div>

      {/* Fallback hint */}
      {pdfBlobUrl && !isGenerating && (
        <p className="text-center text-xs text-slate-600">
          ✦ If the PDF doesn&apos;t appear above, your browser may block embedded PDFs —
          the <strong className="text-slate-400">Download PDF</strong> button will still work.
        </p>
      )}
    </div>
  );
}
