'use client'

import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseForm } from '@/components/purchases/PurchaseForm'
import { productsService } from '@/services/products.service'
import type { Product } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function NewPurchasePage() {
  const { data: products = [], isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsService.list(),
  })

  if (isLoading) {
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
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <ErrorState
          title="পণ্য লোড ব্যর্থ হয়েছে"
          description="পণ্যের তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return <PurchaseForm products={products} />
}
