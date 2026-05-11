import { ExternalLink, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Reference } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateOnly } from '../../utils/formatDate'

export function ReferenceListRow({
  refItem,
  categoryLabel,
}: {
  refItem: Reference
  categoryLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-3 py-3.5 last:border-b-0 min-[40rem]:grid-cols-12 min-[40rem]:items-center min-[40rem]:gap-4 min-[40rem]:px-4 dark:border-gray-800">
      <div className="min-w-0 min-[40rem]:col-span-7">
        <div className="flex flex-col gap-1 min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between min-[40rem]:gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-gray-900 min-[40rem]:min-w-0 min-[40rem]:flex-1 dark:text-white">
            {refItem.title}
          </h3>
          <p
            className="text-xs leading-snug text-gray-500 break-keep text-pretty min-[40rem]:max-w-[min(46%,15rem)] min-[40rem]:shrink-0 min-[40rem]:text-right dark:text-gray-400"
            title={categoryLabel}
          >
            {categoryLabel}
          </p>
        </div>
        {refItem.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 min-[40rem]:line-clamp-1 dark:text-gray-300">
            {refItem.summary}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 min-[40rem]:col-span-5">
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {formatDateOnly(refItem.written_at, 'iso-date')}
        </span>
        <ActiveBadge active={refItem.is_active} />
        <a
          href={refItem.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#FF8A50] transition hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-800"
          title="링크 열기"
          aria-label="링크 열기"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
        </a>
        <Link
          to={`/references/${refItem.id}/edit`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800"
          title="수정"
          aria-label="수정"
        >
          <Pencil className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
