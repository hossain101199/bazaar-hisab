'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseForm } from '@/components/purchases/PurchaseForm'
import { productsService } from '@/services/products.service'
import type { Product } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function NewPurchasePage() {
  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsService.list().then(r => r.data.products),
  })

  useEffect(() => {
    if (isError) toast.error('পণ্য লোড ব্যর্থ হয়েছে')
  }, [isError])

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    )
  }

  return <PurchaseForm products={products} />
}
