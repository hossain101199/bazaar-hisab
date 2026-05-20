'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { productsService } from '@/services/products.service'
import { purchasesService } from '@/services/purchases.service'
import type { PriceTrend, Product, ProductByShop, ShopSummary, TopProduct } from '@/types'
import { ChartTooltip } from '@/components/ui/chart-tooltip'
import { useChartColor } from '@/hooks/useChartColor'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { selectIsAdmin, useAuthStore } from '@/store/auth.store'
import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

function TopProductsList({ products, loading, error, onRetry }: {
  products: TopProduct[]; loading: boolean; error: boolean; onRetry: () => void
}) {
  const chartColor = useChartColor()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">সবচেয়ে বেশি খরচ হওয়া পণ্য</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {loading && <Skeleton className="h-52 w-full" />}
        {error && !loading && <ErrorState compact onRetry={onRetry} />}
        {!loading && !error && products.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">এই সময়ে কোনো তথ্য নেই</p>
        )}
        {!loading && !error && products.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={products.map(p => ({ name: p.product.name, amount: p.totalSpent }))}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" name="খরচ" radius={[0, 4, 4, 0]} fill={chartColor} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 space-y-0">
              {products.map((p, i) => (
                <div key={p.product.id} className="flex items-center justify-between px-3 py-2 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="truncate font-medium">{p.product.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">{p.purchaseCount} বার</span>
                    <span className="font-semibold">{formatCurrency(p.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PriceTrendSection({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const chartColor = useChartColor()

  const { data: trend, isLoading, isError, refetch } = useQuery<PriceTrend>({
    queryKey: ['price-trend', selectedId],
    queryFn: () => purchasesService.priceTrend(selectedId as number),
    enabled: !!selectedId,
  })

  const chartData = trend?.trend.map(point => ({
    date: format(new Date(point.date), 'dd MMM yy', { locale: bn }),
    price: point.pricePerUnit,
  })) ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">পণ্যের দামের ইতিহাস</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-4">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : '')}
          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">পণ্য বেছে নিন...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.unit.name})</option>
          ))}
        </select>

        {!selectedId && (
          <p className="text-sm text-muted-foreground text-center py-8">উপরে একটি পণ্য বেছে নিন</p>
        )}

        {selectedId && isLoading && <Skeleton className="h-48 w-full" />}

        {selectedId && isError && !isLoading && (
          <ErrorState compact onRetry={() => refetch()} />
        )}

        {selectedId && !isLoading && !isError && trend && (
          <>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">এই পণ্যের কোনো ক্রয় ইতিহাস নেই</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                            <p className="font-semibold">{label}</p>
                            <p className="text-muted-foreground">
                              একক দাম: {formatCurrency(payload[0].value as number)} / {trend.product.unit.name}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Line type="monotone" dataKey="price" name="একক দাম" strokeWidth={2} dot={{ r: 3 }} stroke={chartColor} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>সর্বনিম্ন: {formatCurrency(Math.min(...trend.trend.map(t => t.pricePerUnit)))} / {trend.product.unit.name}</span>
                  <span>সর্বোচ্চ: {formatCurrency(Math.max(...trend.trend.map(t => t.pricePerUnit)))} / {trend.product.unit.name}</span>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ShopReportSection({ shops, loading, error, onRetry }: {
  shops: ShopSummary[]; loading: boolean; error: boolean; onRetry: () => void
}) {
  const chartColor = useChartColor()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">দোকান অনুযায়ী খরচ</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {loading && <Skeleton className="h-52 w-full" />}
        {error && !loading && <ErrorState compact onRetry={onRetry} />}
        {!loading && !error && shops.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">এই সময়ে দোকানসহ কোনো বাজার নেই</p>
        )}
        {!loading && !error && shops.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={Math.max(120, shops.length * 40)}>
              <BarChart
                data={shops.map(s => ({ name: s.shop.name, amount: s.totalSpent }))}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" name="খরচ" radius={[0, 4, 4, 0]} fill={chartColor} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 space-y-0">
              {shops.map((s, i) => (
                <div key={s.shop.id} className="flex items-center justify-between px-3 py-2 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="truncate font-medium">{s.shop.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">{s.purchaseCount} বার</span>
                    <span className="font-semibold">{formatCurrency(s.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ProductByShopSection({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<number | ''>('')

  const { data, isLoading, isError, refetch } = useQuery<ProductByShop>({
    queryKey: ['product-by-shop', selectedId],
    queryFn: () => purchasesService.productByShop(selectedId as number),
    enabled: !!selectedId,
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">পণ্য দোকানে তুলনা</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-4">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : '')}
          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">পণ্য বেছে নিন...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.unit.name})</option>
          ))}
        </select>

        {!selectedId && (
          <p className="text-sm text-muted-foreground text-center py-8">উপরে একটি পণ্য বেছে নিন</p>
        )}

        {selectedId && isLoading && <Skeleton className="h-32 w-full" />}
        {selectedId && isError && !isLoading && <ErrorState compact onRetry={() => refetch()} />}

        {selectedId && !isLoading && !isError && data && (
          <>
            {data.shops.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">এই পণ্যের কোনো দোকান ডেটা নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-1 font-medium">দোকান</th>
                      <th className="text-right py-2 px-1 font-medium">গড় দাম</th>
                      <th className="text-right py-2 px-1 font-medium">সংখ্যা</th>
                      <th className="text-right py-2 px-1 font-medium">সর্বশেষ দাম</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shops.map((entry, i) => (
                      <tr key={entry.shop.id} className={`border-b last:border-0 ${i === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        <td className="py-2 px-1 font-medium">{entry.shop.name}</td>
                        <td className="py-2 px-1 text-right">{formatCurrency(entry.avgPricePerUnit)}</td>
                        <td className="py-2 px-1 text-right text-muted-foreground">{entry.purchaseCount}</td>
                        <td className="py-2 px-1 text-right">{formatCurrency(entry.lastPricePerUnit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2 px-1">গড় দাম অনুযায়ী সাজানো — প্রথম সারি সবচেয়ে সস্তা</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function AnalysisPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState('')
  const isAdmin = useAuthStore(selectIsAdmin)

  const { data: topProducts = [], isLoading: topLoading, isError: topError, refetch: refetchTop } =
    useQuery<TopProduct[]>({
      queryKey: ['top-products', { year: month ? undefined : year, month: month || undefined }],
      queryFn: () => purchasesService.topProducts(
        month ? { month } : { year }
      ),
    })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsService.list(),
  })

  const { data: shopReport = [], isLoading: shopLoading, isError: shopError, refetch: refetchShop } =
    useQuery<ShopSummary[]>({
      queryKey: ['shop-report', { year: month ? undefined : year, month: month || undefined }],
      queryFn: () => purchasesService.shopReport(
        month ? { month } : { year }
      ),
    })

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">বিশ্লেষণ</h1>
          {isAdmin && <p className="text-xs text-muted-foreground mt-0.5">সকল ব্যবহারকারীর তথ্য</p>}
        </div>

        <div className="flex items-center gap-2">
          {!month && (
            <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
              <button
                onClick={() => setYear(y => y - 1)}
                className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm rounded-md hover:bg-background transition-colors"
              >‹</button>
              <span className="font-semibold text-sm w-12 text-center">{year}</span>
              <button
                onClick={() => setYear(y => Math.min(currentYear, y + 1))}
                disabled={year >= currentYear}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1 text-sm rounded-md hover:bg-background transition-colors"
              >›</button>
            </div>
          )}
          <input
            type="month"
            value={month}
            max={new Date().toISOString().slice(0, 7)}
            onChange={e => {
              setMonth(e.target.value)
              // Reset year to current so clearing the month returns to current-year view.
              if (e.target.value) setYear(currentYear)
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          {month && (
            <button
              onClick={() => setMonth('')}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              বছর দেখুন
            </button>
          )}
        </div>
      </div>

      <TopProductsList
        products={topProducts}
        loading={topLoading}
        error={topError}
        onRetry={refetchTop}
      />

      <ShopReportSection
        shops={shopReport}
        loading={shopLoading}
        error={shopError}
        onRetry={refetchShop}
      />

      <PriceTrendSection products={products} />

      <ProductByShopSection products={products} />
    </div>
  )
}
