'use client'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { purchasesService } from '@/services/purchases.service'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import type { Purchase, SummaryReport } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { CalendarDays, MapPin, Package, Plus, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function StatCard({ title, value, icon: Icon, loading }: {
  title: string; value: string; icon: React.ElementType; loading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {loading
            ? <Skeleton className="h-6 w-20 mt-1" />
            : <p className="text-xl font-bold leading-tight">{value}</p>
          }
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = useAuthStore(selectIsAdmin)

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery<SummaryReport>({
    queryKey: ['summary', new Date().getFullYear()],
    queryFn: () => purchasesService.summary(),
  })

  const {
    data: recent = [],
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useQuery<Purchase[]>({
    queryKey: ['purchases-recent'],
    queryFn: () => purchasesService.list({ limit: 5 }).then(r => r.purchases),
  })

  const loading = summaryLoading || recentLoading
  const hasError = summaryError || recentError
  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonth = summary?.months.find(m => m.month === currentMonth)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">স্বাগতম, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: bn })}
        </p>
      </div>

      {hasError && !loading ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState
              compact
              onRetry={() => { refetchSummary(); refetchRecent() }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title={isAdmin ? "এই মাসে মোট খরচ" : "এই মাসের খরচ"} value={formatCurrency(thisMonth?.totalAmount ?? 0)} icon={TrendingUp} loading={loading} />
            <StatCard title={isAdmin ? "এই মাসে মোট বাজার" : "এই মাসের বাজার"} value={`${thisMonth?.purchaseCount ?? 0} টি`} icon={ShoppingCart} loading={loading} />
            <StatCard title={isAdmin ? "বার্ষিক মোট (সকল)" : "বার্ষিক মোট"} value={formatCurrency(summary?.totalAmount ?? 0)} icon={CalendarDays} loading={loading} />
            <StatCard title={`${summary?.year ?? new Date().getFullYear()} সালের মাস`} value={`${summary?.months.length ?? 0} টি`} icon={Package} loading={loading} />
          </div>

          <div className="flex gap-2">
            {!isAdmin && (
              <Link href="/purchases/new" className={cn(buttonVariants({ size: 'sm' }), 'flex-1 justify-center')}>
                <Plus className="h-4 w-4 mr-1" /> নতুন বাজার
              </Link>
            )}
            <Link href="/purchases" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'flex-1 justify-center')}>
              সব দেখুন
            </Link>
          </div>

          <div>
            <h2 className="font-semibold mb-3">সাম্প্রতিক বাজার</h2>
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            )}
            {!loading && recent.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  এখনো কোনো বাজার নেই।{' '}
                  {!isAdmin && (
                    <Link href="/purchases/new" className="underline text-foreground">প্রথম বাজার যোগ করুন</Link>
                  )}
                </CardContent>
              </Card>
            )}
            {!loading && recent.map(p => (
              <Link key={p.id} href={`/purchases/${p.id}`}>
                <Card className="mb-2 hover:bg-accent transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(p.date), 'dd MMM yyyy', { locale: bn })}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">{p.items.length} পণ্য</Badge>
                        {p.shop && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1">
                            <MapPin className="h-2.5 w-2.5" />{p.shop.name}
                          </Badge>
                        )}
                        {p.note && (
                          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{p.note}</span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-base shrink-0">{formatCurrency(p.totalAmount)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
