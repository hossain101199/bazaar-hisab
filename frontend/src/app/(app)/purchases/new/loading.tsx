import { Skeleton } from '@/components/ui/skeleton'

export default function NewPurchaseLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-7 w-36" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  )
}
