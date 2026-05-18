'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ShopDialog } from '@/components/shops/ShopDialog'
import { extractErrorMessage } from '@/lib/error-handler'
import { shopsService } from '@/services/shops.service'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import type { Shop } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShopRowProps {
  s: Shop
  isAdmin: boolean
  onEdit: (s: Shop) => void
  onDelete: (s: Shop) => void
}

function ShopRow({ s, isAdmin, onEdit, onDelete }: ShopRowProps) {
  const canEdit = s.type === 'USER' || isAdmin

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{s.name}</span>
          {s.type === 'SYSTEM' && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">সিস্টেম</Badge>
          )}
        </div>
        {s.address && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {s.address}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`"${s.name}" সম্পাদনা করুন`}
            onClick={() => onEdit(s)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={`"${s.name}" মুছুন`}
            onClick={() => onDelete(s)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ShopsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore(selectIsAdmin)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Shop | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null)

  const { data: shops = [], isLoading, isError, refetch } = useQuery<Shop[]>({
    queryKey: ['shops'],
    queryFn: () => shopsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shopsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      toast.success('দোকান মুছে ফেলা হয়েছে')
    },
    onError: (err: unknown) => {
      const { message } = extractErrorMessage(err)
      toast.error(message)
    },
  })

  const openAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (s: Shop) => { setEditTarget(s); setDialogOpen(true) }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
    setDeleteTarget(null)
  }

  const systemShops = shops.filter(s => s.type === 'SYSTEM')
  const userShops = shops.filter(s => s.type === 'USER')

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">দোকান তালিকা</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> নতুন দোকান
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      )}

      {isError && !isLoading && (
        <Card>
          <CardContent className="p-0">
            <ErrorState compact onRetry={() => refetch()} />
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && systemShops.length > 0 && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">সিস্টেম দোকান</p>
            {systemShops.map(s => (
              <ShopRow key={s.id} s={s} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">আমার দোকান</p>
            {userShops.length === 0 ? (
              <EmptyState
                icon={Store}
                title="কোনো দোকান নেই"
                description='"নতুন দোকান" বাটনে ক্লিক করে দোকান যোগ করুন'
                className="py-8"
              />
            ) : (
              userShops.map(s => (
                <ShopRow key={s.id} s={s} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      <ShopDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['shops'] })}
        shop={editTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`"${deleteTarget?.name}" মুছে ফেলবেন?`}
        description="এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
