'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseForm } from '@/components/purchases/PurchaseForm'
import { productsService } from '@/services/products.service'
import { purchasesService } from '@/services/purchases.service'
import type { Product, Purchase } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const purchaseId = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: purchase, isLoading: purchaseLoading, isError: purchaseError, refetch: refetchPurchase } =
    useQuery<Purchase>({
      queryKey: ['purchase', purchaseId],
      queryFn: () => purchasesService.getById(purchaseId),
    })

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: () => purchasesService.delete(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      toast.success('বাজার মুছে ফেলা হয়েছে')
      router.replace('/purchases')
    },
    onError: () => toast.error('মুছে ফেলা ব্যর্থ হয়েছে'),
  })

  const handleDelete = () => {
    setConfirmOpen(false)
    deleteMutation.mutate()
  }

  const loading = purchaseLoading || productsLoading

  if (loading) {
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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    )
  }

  if (purchaseError) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => router.push('/purchases')}
          className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> ফিরে যান
        </button>
        <ErrorState
          title="বাজার লোড ব্যর্থ হয়েছে"
          description="এই বাজারটি লোড করা যায়নি। আবার চেষ্টা করুন।"
          onRetry={() => refetchPurchase()}
        />
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => router.push('/purchases')}
          className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> ফিরে যান
        </button>
        <p className="text-center text-muted-foreground py-8">বাজার পাওয়া যায়নি।</p>
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <PurchaseForm
        products={products}
        purchase={purchase}
        onCancel={() => {
          queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] })
          setMode('view')
        }}
      />
    )
  }

  const fmt = (n: number) => '৳' + n.toLocaleString('bn-BD', { maximumFractionDigits: 2 })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/purchases')}
          aria-label="ক্রয় তালিকায় ফিরে যান"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">
            {format(new Date(purchase.date), 'dd MMMM yyyy', { locale: bn })}
          </h1>
          {purchase.note && <p className="text-sm text-muted-foreground">{purchase.note}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setMode('edit')} className="flex-1">
          <Pencil className="h-3.5 w-3.5 mr-1" /> সম্পাদনা
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)} className="flex-1">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> মুছুন
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="বাজার মুছে ফেলবেন?"
        description="এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।"
        loading={deleteMutation.isPending}
      />

      <Card>
        <CardContent className="p-0">
          {purchase.items.map((item, i) => (
            <div key={item.id}>
              {i > 0 && <Separator />}
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.product.name}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{item.product.unit.name}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.quantity} {item.product.unit.name} × {fmt(item.pricePerUnit)}
                  </p>
                </div>
                <p className="font-semibold text-sm shrink-0">{fmt(item.totalPrice)}</p>
              </div>
            </div>
          ))}
          <Separator />
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">মোট ({purchase.items.length} পণ্য)</p>
            <p className="text-xl font-bold">{fmt(purchase.totalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        যোগ করা হয়েছে: {format(new Date(purchase.createdAt), 'dd MMM yyyy, HH:mm', { locale: bn })}
      </p>
    </div>
  )
}
