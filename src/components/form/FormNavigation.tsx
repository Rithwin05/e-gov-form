import React from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Download, Loader2, RefreshCcw } from "lucide-react";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
  isDownloading?: boolean;
  hasPdf?: boolean;
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onDownload,
  isGenerating = false,
  isDownloading = false,
  hasPdf = false,
}: FormNavigationProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const busy = isGenerating || isDownloading;

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
      {/* ── Previous ─────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={isFirstStep || busy}
        className={isFirstStep ? "invisible" : ""}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>

      {/* ── Right side action ─────────────────────── */}
      {isLastStep ? (
        <div className="flex items-center gap-3">
          {/* Re-generate button (shown after initial generation) */}
          {hasPdf && !isGenerating && (
            <Button
              type="button"
              variant="outline"
              onClick={onNext}        /* onNext calls generatePreview again */
              disabled={busy}
              className="text-slate-400 hover:text-white text-sm"
              title="Re-generate preview with current form data"
            >
              <RefreshCcw className="w-4 h-4 mr-1.5" />
              Re-generate
            </Button>
          )}

          {/* Download button */}
          <Button
            type="button"
            onClick={onDownload}
            disabled={busy || !hasPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px] gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={onNext} disabled={busy}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
