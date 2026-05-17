import { Skeleton } from '@/components/ui/skeleton'

export default function PurchaseDetailLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-7 w-44" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
      <div className="space-y-0 rounded-xl border overflow-hidden">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-none border-b last:border-0" />)}
        <Skeleton className="h-14 rounded-none" />
      </div>
    </div>
  )
}
