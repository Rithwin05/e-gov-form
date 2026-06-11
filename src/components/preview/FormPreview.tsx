"use client";

import React from "react";
import { Loader2, AlertCircle, FileText } from "lucide-react";

interface FormPreviewProps {
  pdfBlobUrl: string | null;
  isGenerating: boolean;
  error: string | null;
}

export function FormPreview({ pdfBlobUrl, isGenerating, error }: FormPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Document Preview
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Review your filled Aadhaar certificate below. Click{" "}
          <strong className="text-emerald-400">Download PDF</strong> when you&apos;re satisfied with the details.
        </p>
      </div>

      {/* PDF Viewer Area */}
      <div className="relative w-full rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden"
           style={{ height: "75vh", minHeight: "500px" }}>

        {/* Loading State */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95 z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <FileText className="w-7 h-7 text-blue-400 absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Generating your certificate…</p>
              <p className="text-slate-400 text-sm mt-1">This takes just a moment</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isGenerating && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-700/50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-white font-medium">Failed to generate preview</p>
              <p className="text-slate-400 text-sm mt-1 break-words">{error}</p>
            </div>
          </div>
        )}

        {/* PDF iframe */}
        {!isGenerating && !error && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            className="w-full h-full border-0"
            title="Aadhaar Certificate Preview"
          />
        )}

        {/* Empty placeholder before generation starts */}
        {!isGenerating && !error && !pdfBlobUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-600 text-sm">Loading preview…</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {pdfBlobUrl && !isGenerating && (
        <p className="text-center text-xs text-slate-500">
          ✦ If the PDF doesn&apos;t render above, your browser may be blocking embedded PDFs — clicking Download will still work.
        </p>
      )}
    </div>
  );
}
