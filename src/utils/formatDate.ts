import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'yyyy.MM.dd HH:mm', { locale: ko })
  } catch {
    return iso
  }
}

export function formatDateOnly(
  value: string | null | undefined,
  kind: 'iso-date' | 'iso-datetime' = 'iso-datetime'
): string {
  if (!value) return '—'
  try {
    const d = kind === 'iso-date' ? parseISO(`${value}T00:00:00`) : parseISO(value)
    return format(d, 'yyyy.MM.dd', { locale: ko })
  } catch {
    return value
  }
}
