import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
        
        {/* Progress line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-300 ease-in-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {/* Step circles */}
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <div key={stepNum} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                  isCompleted 
                    ? "bg-blue-500 border-blue-500 text-white" 
                    : isCurrent 
                      ? "bg-slate-900 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      : "bg-slate-900 border-slate-700 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              
              {/* Step label (hidden on very small screens) */}
              <span 
                className={cn(
                  "absolute top-10 text-xs font-medium whitespace-nowrap hidden sm:block transition-colors duration-300",
                  isCurrent ? "text-blue-400" : isCompleted ? "text-slate-300" : "text-slate-600"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
