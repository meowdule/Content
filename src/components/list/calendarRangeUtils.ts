import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export function ymd(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function parseYmd(ymd: string): Date {
  return parseISO(`${ymd}T12:00:00`)
}

/** 월 그리드용 주 단위 배열 (월요일 시작) */
export function monthWeeks(anchorInMonth: Date): Date[][] {
  const m0 = startOfMonth(anchorInMonth)
  const m1 = endOfMonth(anchorInMonth)
  const gridStart = startOfWeek(m0, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(m1, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

export function inRangeInclusive(dayYmd: string, from: string, to: string): boolean {
  if (!from) return false
  const end = to || from
  return dayYmd >= from && dayYmd <= end
}

export function isToday(day: Date): boolean {
  return ymd(day) === ymd(new Date())
}

export { addMonths, isSameMonth, startOfMonth }
