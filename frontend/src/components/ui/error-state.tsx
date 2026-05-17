'use client'

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ErrorState({
  title = "ডেটা লোড ব্যর্থ হয়েছে",
  description = "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-4" : "py-12 px-6",
      className
    )}>
      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[220px]">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 mt-1">
          <RefreshCw className="h-3.5 w-3.5" />
          আবার চেষ্টা করুন
        </Button>
      )}
    </div>
  )
}
