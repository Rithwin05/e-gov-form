import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioCardProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative flex cursor-pointer rounded-xl border p-4 hover:bg-slate-800/50 transition-all duration-200",
          "has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500",
          error ? "border-red-500" : "border-slate-800",
          className
        )}
      >
        <input
          type="radio"
          className="peer sr-only"
          ref={ref}
          {...props}
        />
        
        {/* Custom radio circle */}
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-500">
          <span className="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </span>
        
        <div className="ml-3 flex flex-col">
          <span className="text-sm font-medium text-slate-200 peer-checked:text-blue-400">
            {label}
          </span>
          {description && (
            <span className="text-xs text-slate-500 mt-1">
              {description}
            </span>
          )}
        </div>
      </label>
    )
  }
)
RadioCard.displayName = "RadioCard"

export { RadioCard }
