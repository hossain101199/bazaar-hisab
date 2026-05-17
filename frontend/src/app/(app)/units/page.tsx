'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { UnitDialog } from '@/components/units/UnitDialog'
import { extractErrorMessage } from '@/lib/error-handler'
import { unitsService } from '@/services/units.service'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import type { Unit } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const GROUP_LABEL: Record<string, string> = {
  weight: 'ওজন',
  volume: 'পরিমাণ',
  count: 'সংখ্যা',
}

interface UnitRowProps {
  u: Unit
  isAdmin: boolean
  onEdit: (u: Unit) => void
  onDelete: (u: Unit) => void
}

function UnitRow({ u, isAdmin, onEdit, onDelete }: UnitRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{u.name}</span>
          {u.groupKey && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {GROUP_LABEL[u.groupKey] ?? u.groupKey}
            </Badge>
          )}
          {u.type === 'SYSTEM' && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">সিস্টেম</Badge>
          )}
        </div>
        {u.baseRatio != null && (
          <p className="text-xs text-muted-foreground mt-0.5">বেস অনুপাত: {u.baseRatio}</p>
        )}
      </div>
      {u.type === 'USER' && (
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`"${u.name}" সম্পাদনা করুন`}
            onClick={() => onEdit(u)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={`"${u.name}" মুছুন`}
            onClick={() => onDelete(u)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {u.type === 'SYSTEM' && isAdmin && (
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`"${u.name}" সম্পাদনা করুন`}
            onClick={() => onEdit(u)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={`"${u.name}" মুছুন`}
            onClick={() => onDelete(u)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function UnitsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore(selectIsAdmin)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Unit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)

  const { data: units = [], isLoading, isError, refetch } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: () => unitsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast.success('একক মুছে ফেলা হয়েছে')
    },
    onError: (err: unknown) => {
      const { message } = extractErrorMessage(err)
      toast.error(message)
    },
  })

  const openAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (u: Unit) => { setEditTarget(u); setDialogOpen(true) }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
    setDeleteTarget(null)
  }

  const systemUnits = units.filter(u => u.type === 'SYSTEM')
  const userUnits = units.filter(u => u.type === 'USER')

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">একক তালিকা</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> নতুন একক
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

      {!isLoading && !isError && systemUnits.length > 0 && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">সিস্টেম একক</p>
            {systemUnits.map(u => (
              <UnitRow key={u.id} u={u} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardContent className="px-4 py-1">
            <p className="text-xs font-semibold text-muted-foreground py-2">আমার একক</p>
            {userUnits.length === 0 ? (
              <EmptyState
                icon={Ruler}
                title="কোনো একক নেই"
                description='"নতুন একক" বাটনে ক্লিক করে একক যোগ করুন'
                className="py-8"
              />
            ) : (
              userUnits.map(u => (
                <UnitRow key={u.id} u={u} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      <UnitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['units'] })}
        unit={editTarget}
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
