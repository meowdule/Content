import { useEffect, useRef, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { Button } from '../common/Button'
import { formatDateOnly } from '../../utils/formatDate'

function clamp(from: string, to: string): { from: string; to: string } {
  if (from && to && from > to) return { from, to: from }
  return { from, to }
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
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDraftFrom(dateFrom)
    setDraftTo(dateTo)
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
          className="absolute left-0 top-full z-30 mt-1 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="dialog"
          aria-label="등록일 기간 선택"
        >
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">시작일과 종료일을 함께 지정합니다.</p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">시작</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={draftFrom}
              onChange={(e) => {
                const v = e.target.value
                const next = clamp(v, draftTo)
                setDraftFrom(next.from)
                setDraftTo(next.to)
              }}
            />
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">종료</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={draftTo}
              onChange={(e) => {
                const v = e.target.value
                const next = clamp(draftFrom, v)
                setDraftFrom(next.from)
                setDraftTo(next.to)
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" className="text-xs" onClick={apply}>
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
