import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '../common/Button'
import { formatDateOnly } from '../../utils/formatDate'
import {
  addMonths,
  inRangeInclusive,
  isSameMonth,
  isToday,
  monthWeeks,
  parseYmd,
  startOfMonth,
  ymd,
} from './calendarRangeUtils'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

function clamp(from: string, to: string): { from: string; to: string } {
  if (from && to && from > to) return { from, to: from }
  return { from, to }
}

function MonthGrid({
  visibleMonth,
  onPrev,
  onNext,
  draftFrom,
  draftTo,
  onPickDay,
}: {
  visibleMonth: Date
  onPrev: () => void
  onNext: () => void
  draftFrom: string
  draftTo: string
  onPickDay: (ymd: string) => void
}) {
  const weeks = useMemo(() => monthWeeks(visibleMonth), [visibleMonth])

  return (
    <div className="w-[min(100%,11.75rem)] shrink-0">
      <div className="mb-1.5 flex items-center justify-between gap-0.5">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="이전 달"
        >
          ‹
        </button>
        <span className="min-w-0 flex-1 text-center text-[11px] font-semibold leading-tight text-gray-900 dark:text-white">
          {format(visibleMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>
      <div className="mb-0.5 grid grid-cols-7 gap-px text-center text-[8px] font-medium tracking-tight text-gray-400 dark:text-gray-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.map((day) => {
              const d = ymd(day)
              const outside = !isSameMonth(day, visibleMonth)
              const inSel = inRangeInclusive(d, draftFrom, draftTo)
              const onlyFrom = Boolean(draftFrom && !draftTo)
              const isStart = Boolean(draftFrom && d === draftFrom)
              const isEnd = Boolean(draftTo && d === draftTo)
              const today = isToday(day)

              let tone =
                'relative flex h-6 min-w-0 items-center justify-center rounded-md text-[10px] tabular-nums leading-none transition text-gray-900 dark:text-gray-100'
              if (!outside) {
                if (onlyFrom && isStart) {
                  tone +=
                    ' bg-[#FF8A50] font-semibold text-white shadow-sm ring-2 ring-[#FF8A50]/40 ring-offset-1 dark:ring-offset-gray-900'
                } else if (draftFrom && draftTo && inSel) {
                  if (isStart || isEnd) {
                    tone += ' bg-[#FF8A50] font-semibold text-white'
                  } else {
                    tone +=
                      ' bg-[#FF8A50]/18 font-medium text-[#9a4510] dark:bg-orange-500/25 dark:text-orange-100'
                  }
                } else if (today) {
                  tone += ' ring-1 ring-gray-300 dark:ring-gray-600'
                } else {
                  tone += ' hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              }

              return (
                <button
                  key={d}
                  type="button"
                  disabled={outside}
                  onClick={() => !outside && onPickDay(d)}
                  className={
                    outside
                      ? 'flex h-6 min-w-0 cursor-default items-center justify-center rounded-md text-transparent'
                      : tone
                  }
                >
                  {!outside ? format(day, 'd') : ''}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DateRangeControl({
  dateFrom,
  dateTo,
  onApply,
  onClear,
}: {
  dateFrom: string
  dateTo: string
  onApply: (from: string, to: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(dateFrom)
  const [draftTo, setDraftTo] = useState(dateTo)
  const [monthLeft, setMonthLeft] = useState(() => startOfMonth(new Date()))
  const [monthRight, setMonthRight] = useState(() => addMonths(startOfMonth(new Date()), 1))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDraftFrom(dateFrom)
    setDraftTo(dateTo)
    const base = dateFrom ? parseYmd(dateFrom) : new Date()
    const left = startOfMonth(base)
    setMonthLeft(left)
    setMonthRight(dateTo ? startOfMonth(parseYmd(dateTo)) : addMonths(left, 1))
  }, [open, dateFrom, dateTo])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pickDay = (d: string) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(d)
      setDraftTo('')
      return
    }
    if (d < draftFrom) {
      setDraftTo(draftFrom)
      setDraftFrom(d)
    } else {
      setDraftTo(d)
    }
  }

  const summary =
    dateFrom || dateTo
      ? `${dateFrom ? formatDateOnly(dateFrom, 'iso-date') : '…'} ~ ${dateTo ? formatDateOnly(dateTo, 'iso-date') : '…'}`
      : '기간 선택'

  const apply = () => {
    const { from, to } = clamp(draftFrom, draftTo)
    onApply(from, to)
    setOpen(false)
  }

  const clearAndClose = () => {
    onClear()
    setDraftFrom('')
    setDraftTo('')
    setOpen(false)
  }

  return (
    <div className="relative inline-block min-w-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-[12rem] max-w-[20rem] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none hover:border-[#FF8A50]/60 focus:border-[#FF8A50] focus:ring-2 focus:ring-[#FF8A50]/25 min-[40rem]:w-auto dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarRange className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span className="min-w-0 flex-1 truncate tabular-nums">{summary}</span>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-30 mt-1 w-[min(100vw-1rem,26rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:w-[min(100vw-1rem,28rem)]"
          role="dialog"
          aria-label="등록일 기간 선택"
        >
          <p className="mb-2 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
            달력에서 시작일·종료일을 차례로 누르면 기간이 잡힙니다. 두 달력을 함께 사용할 수 있습니다.
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <MonthGrid
              visibleMonth={monthLeft}
              onPrev={() => setMonthLeft((m) => addMonths(m, -1))}
              onNext={() => setMonthLeft((m) => addMonths(m, 1))}
              draftFrom={draftFrom}
              draftTo={draftTo}
              onPickDay={pickDay}
            />
            <div className="hidden w-px shrink-0 bg-gray-200 sm:block dark:bg-gray-700" aria-hidden />
            <MonthGrid
              visibleMonth={monthRight}
              onPrev={() => setMonthRight((m) => addMonths(m, -1))}
              onNext={() => setMonthRight((m) => addMonths(m, 1))}
              draftFrom={draftFrom}
              draftTo={draftTo}
              onPickDay={pickDay}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button type="button" className="text-xs" onClick={apply} disabled={!draftFrom}>
              적용
            </Button>
            <Button type="button" variant="outline" className="text-xs" onClick={clearAndClose}>
              전체 기간
            </Button>
            <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
              취소
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
