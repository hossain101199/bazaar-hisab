import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-7 w-44" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
