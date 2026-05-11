import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
      <span>
        총 {total}건 · {pageSize}개씩
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="px-2 py-1"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tabular-nums">
          {current} / {pageCount}
        </span>
        <Button
          variant="outline"
          className="px-2 py-1"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
