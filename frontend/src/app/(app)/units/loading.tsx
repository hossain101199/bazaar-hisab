import { Skeleton } from '@/components/ui/skeleton'

export default function UnitsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  )
}
