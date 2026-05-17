'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="text-lg font-bold mb-2">কিছু একটা ভুল হয়েছে</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        অপ্রত্যাশিত একটি সমস্যা হয়েছে। পেজ রিফ্রেশ করুন অথবা আবার চেষ্টা করুন।
      </p>
      <Button onClick={reset}>আবার চেষ্টা করুন</Button>
    </div>
  )
}
