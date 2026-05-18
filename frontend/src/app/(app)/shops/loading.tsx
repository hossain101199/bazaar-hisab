import { Skeleton } from '@/components/ui/skeleton'

export default function ShopsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-8 w-40" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
    </div>
  )
}
