'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { purchasesService } from '@/services/purchases.service'
import type { SummaryReport } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { ChartTooltip } from '@/components/ui/chart-tooltip'
import { useChartColor } from '@/hooks/useChartColor'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']

function prevMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function CompareSection() {
  const today = new Date().toISOString().slice(0, 7)
  const [monthA, setMonthA] = useState(prevMonth(today))
  const [monthB, setMonthB] = useState(today)

  const yearA = Number(monthA.split('-')[0])
  const yearB = Number(monthB.split('-')[0])

  const { data: summaryA } = useQuery<SummaryReport>({
    queryKey: ['summary', yearA],
    queryFn: () => purchasesService.summary(yearA),
  })
  const { data: summaryB } = useQuery<SummaryReport>({
    queryKey: ['summary', yearB],
    queryFn: () => purchasesService.summary(yearB),
  })

  const dataA = summaryA?.months.find(m => m.month === monthA)
  const dataB = summaryB?.months.find(m => m.month === monthB)

  const amountDiff = dataA && dataB
    ? ((dataB.totalAmount - dataA.totalAmount) / (dataA.totalAmount || 1)) * 100
    : null
  const countDiff = dataA && dataB
    ? ((dataB.purchaseCount - dataA.purchaseCount) / (dataA.purchaseCount || 1)) * 100
    : null

  const diffColor = (n: number | null) =>
    n === null ? '' : n > 0 ? 'text-red-500' : n < 0 ? 'text-green-600' : 'text-muted-foreground'
  const diffText = (n: number | null) =>
    n === null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

  const [ymA_y, ymA_m] = monthA.split('-').map(Number)
  const [ymB_y, ymB_m] = monthB.split('-').map(Number)
  const labelA = `${MONTHS_BN[ymA_m - 1]} ${ymA_y}`
  const labelB = `${MONTHS_BN[ymB_m - 1]} ${ymB_y}`

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">মাস তুলনা</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">মাস ক</p>
            <input
              type="month"
              value={monthA}
              max={today}
              onChange={e => setMonthA(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">মাস খ</p>
            <input
              type="month"
              value={monthB}
              max={today}
              onChange={e => setMonthB(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </div>

        <div className="rounded-lg border divide-y">
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center px-3 py-2.5 gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{labelA}</span>
            <span className="text-center w-16" />
            <span className="font-semibold text-foreground text-right">{labelB}</span>
            <span className="w-14 text-right">পরিবর্তন</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center px-3 py-2.5 gap-2">
            <span className="text-sm font-semibold">{formatCurrency(dataA?.totalAmount ?? 0)}</span>
            <span className="text-xs text-muted-foreground w-16 text-center">মোট খরচ</span>
            <span className="text-sm font-semibold text-right">{formatCurrency(dataB?.totalAmount ?? 0)}</span>
            <span className={`text-xs font-medium w-14 text-right ${diffColor(amountDiff)}`}>{diffText(amountDiff)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center px-3 py-2.5 gap-2">
            <span className="text-sm font-semibold">{dataA?.purchaseCount ?? 0} টি</span>
            <span className="text-xs text-muted-foreground w-16 text-center">বাজার সংখ্যা</span>
            <span className="text-sm font-semibold text-right">{dataB?.purchaseCount ?? 0} টি</span>
            <span className={`text-xs font-medium w-14 text-right ${diffColor(countDiff)}`}>{diffText(countDiff)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const chartColor = useChartColor()

  const { data: summary, isLoading, isError, refetch } = useQuery<SummaryReport>({
    queryKey: ['summary', year],
    queryFn: () => purchasesService.summary(year),
  })

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
    const found = summary?.months.find(m => m.month === monthKey)
    return { name: MONTHS_BN[i], amount: found?.totalAmount ?? 0, count: found?.purchaseCount ?? 0 }
  })

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">বার্ষিক রিপোর্ট</h1>
        <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
          <button
            onClick={() => setYear(y => y - 1)}
            className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm rounded-md hover:bg-background transition-colors"
            aria-label="আগের বছর"
          >
            ‹
          </button>
          <span className="font-semibold text-sm w-12 text-center">{year}</span>
          <button
            onClick={() => setYear(y => Math.min(currentYear, y + 1))}
            disabled={year >= currentYear}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1 text-sm rounded-md hover:bg-background transition-colors disabled:hover:bg-transparent"
            aria-label="পরের বছর"
          >
            ›
          </button>
        </div>
      </div>

      {isError && !isLoading && (
        <Card>
          <CardContent className="p-0">
            <ErrorState compact onRetry={() => refetch()} />
          </CardContent>
        </Card>
      )}

      {!isError && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">বার্ষিক মোট খরচ</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(summary?.totalAmount ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">মোট বাজার সংখ্যা</p>
                  <p className="text-xl font-bold mt-1">
                    {summary?.months.reduce((s, m) => s + m.purchaseCount, 0) ?? 0} টি
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">মাসিক খরচ (৳)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="amount" name="খরচ" radius={[4, 4, 0, 0]} fill={chartColor} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">মাসিক বাজার সংখ্যা</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {isLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="সংখ্যা" strokeWidth={2} dot={{ r: 3 }} stroke={chartColor} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {!isLoading && (summary?.months.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">মাসিক বিবরণ</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {chartData.filter(d => d.amount > 0).map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 text-sm">
                    <span className="text-muted-foreground w-12">{d.name}</span>
                    <span className="flex-1 text-center text-muted-foreground text-xs">{d.count} টি বাজার</span>
                    <span className="font-semibold">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <CompareSection />
        </>
      )}
    </div>
  )
}
