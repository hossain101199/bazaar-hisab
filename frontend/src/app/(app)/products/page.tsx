'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductDialog } from '@/components/products/ProductDialog'
import { extractErrorMessage } from '@/lib/error-handler'
import { productsService } from '@/services/products.service'
import { unitsService } from '@/services/units.service'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import type { Product, Unit } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ProductRowProps {
  product: Product
  isAdmin: boolean
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}

function ProductRow({ product: p, isAdmin, onEdit, onDelete }: ProductRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{p.name}</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">{p.unit.name}</Badge>
          {p.type === 'SYSTEM' && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">সিস্টেম</Badge>
          )}
        </div>
        {p.lastPrice !== null && (
          <p className="text-xs text-muted-foreground mt-0.5">
            সর্বশেষ দাম: ৳{p.lastPrice.toFixed(2)} / {p.unit.name}
          </p>
        )}
      </div>
      {p.type === 'USER' && (
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(p)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(p)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {p.type === 'SYSTEM' && isAdmin && (
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(p)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore(selectIsAdmin)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)

  const { data: products = [], isLoading: productsLoading, isError: productsError } =
    useQuery<Product[]>({
      queryKey: ['products'],
      queryFn: () => productsService.list().then(r => r.data.products),
    })

  const { data: units = [], isLoading: unitsLoading, isError: unitsError } =
    useQuery<Unit[]>({
      queryKey: ['units'],
      queryFn: () => unitsService.list().then(r => r.data.units),
    })

  useEffect(() => {
    if (productsError || unitsError) toast.error('ডেটা লোড ব্যর্থ হয়েছে')
  }, [productsError, unitsError])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('পণ্য মুছে ফেলা হয়েছে')
    },
    onError: (err: unknown) => {
      const { message } = extractErrorMessage(err)
      toast.error(message)
    },
  })

  const loading = productsLoading || unitsLoading

  const openAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (p: Product) => { setEditTarget(p); setDialogOpen(true) }

  const handleDelete = (p: Product) => {
    if (!confirm(`"${p.name}" মুছে ফেলবেন?`)) return
    deleteMutation.mutate(p.id)
  }

  const systemProducts = products.filter(p => p.type === 'SYSTEM')
  const userProducts = products.filter(p => p.type === 'USER')

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">পণ্য তালিকা</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> নতুন পণ্য
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      )}

      {!loading && systemProducts.length > 0 && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">সিস্টেম পণ্য</p>
            {systemProducts.map(p => (
              <ProductRow key={p.id} product={p} isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">আমার পণ্য</p>
            {userProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                কোনো পণ্য নেই — &quot;নতুন পণ্য&quot; বাটনে ক্লিক করুন
              </p>
            ) : (
              userProducts.map(p => (
                <ProductRow key={p.id} product={p} isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
        units={units}
        product={editTarget}
      />
    </div>
  )
}
