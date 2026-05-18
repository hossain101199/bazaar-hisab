import { useEffect, useState } from 'react'

export function useChartColor(fallback = '#4f46e5'): string {
  const [color, setColor] = useState(fallback)
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    if (raw) setColor(raw.includes(' ') ? `hsl(${raw})` : raw)
  }, [])
  return color
}
