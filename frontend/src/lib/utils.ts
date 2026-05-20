import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return "৳" + amount.toLocaleString("bn-BD", { maximumFractionDigits: 0 })
}

export const nativeSelectClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all outline-none cursor-pointer appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
