import React from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting?: boolean;
}

export function FormNavigation({ currentStep, totalSteps, onNext, onPrev, isSubmitting }: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
      <Button
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={currentStep === 1 || isSubmitting}
        className={currentStep === 1 ? "invisible" : ""}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>

      {currentStep < totalSteps ? (
        <Button type="button" onClick={onNext}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      ) : (
        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {isSubmitting ? "Processing..." : "Generate PDF"}
          {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
        </Button>
      )}
    </div>
  );
}
