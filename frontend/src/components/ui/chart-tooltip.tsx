import { formatCurrency } from '@/lib/utils'

interface Props {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}

export function ChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}
