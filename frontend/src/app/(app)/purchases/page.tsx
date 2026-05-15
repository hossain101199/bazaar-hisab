'use client'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { cn, formatCurrency } from '@/lib/utils'
import { purchasesService } from '@/services/purchases.service'
import type { Purchase } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const PAGE_LIMIT = 15

export default function PurchasesPage() {
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError } = useQuery<{ purchases: Purchase[]; total: number }>({
    queryKey: ['purchases', { month, search: debouncedSearch, page }],
    queryFn: () =>
      purchasesService
        .list({ month: month || undefined, search: debouncedSearch || undefined, page, limit: PAGE_LIMIT })
        .then(r => r.data),
  })

  useEffect(() => {
    if (isError) toast.error('ডেটা লোড ব্যর্থ হয়েছে')
  }, [isError])

  const purchases = data?.purchases ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">বাজার তালিকা</h1>
        <Link href="/purchases/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" /> নতুন
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          type="month"
          value={month}
          onChange={e => { setMonth(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm flex-1 min-w-0"
        />
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="খুঁজুন..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      )}

      {!isLoading && purchases.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            <p>কোনো বাজার পাওয়া যায়নি।</p>
            {!debouncedSearch && (
              <Link href="/purchases/new" className="underline text-foreground mt-1 inline-block">
                প্রথম বাজার যোগ করুন
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && purchases.map(p => (
        <Link key={p.id} href={`/purchases/${p.id}`}>
          <Card className="mb-2 hover:bg-accent transition-colors active:scale-[0.99]">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm">
                  {format(new Date(p.date), 'dd MMMM yyyy', { locale: bn })}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{p.items.length} পণ্য</Badge>
                  {p.note && (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">{p.note}</span>
                  )}
                </div>
              </div>
              <p className="font-bold text-base shrink-0">{formatCurrency(p.totalAmount)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> আগের
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages} ({total} টি)</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-40"
          >
            পরের <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {!isLoading && total > 0 && (
        <p className="text-xs text-center text-muted-foreground">মোট: {total} টি বাজার</p>
      )}
    </div>
  )
}
