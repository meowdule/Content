import { endOfDay, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'

export type DateRange = { from: string; to: string }

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function presetYesterday(): DateRange {
  const y = subDays(new Date(), 1)
  return { from: isoDate(startOfDay(y)), to: isoDate(endOfDay(y)) }
}

export function presetThisMonth(): DateRange {
  const now = new Date()
  return { from: isoDate(startOfMonth(now)), to: isoDate(endOfDay(now)) }
}

export function presetLastMonths(n: number): DateRange {
  const now = new Date()
  const start = startOfDay(subMonths(now, n))
  return { from: isoDate(start), to: isoDate(endOfDay(now)) }
}
