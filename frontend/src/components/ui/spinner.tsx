import { cn } from "@/lib/utils"

export function Spinner({ className, size = "md" }: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizes = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-[3px]",
  }
  return (
    <div
      role="status"
      aria-label="লোড হচ্ছে"
      className={cn(
        "animate-spin rounded-full border-current border-t-transparent shrink-0",
        sizes[size],
        className
      )}
    />
  )
}
