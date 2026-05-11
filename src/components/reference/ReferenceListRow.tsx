import { ExternalLink, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Reference } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateOnly, formatDateTime } from '../../utils/formatDate'

export function ReferenceListRow({
  refItem,
  categoryLabel,
}: {
  refItem: Reference
  categoryLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-3 py-3.5 last:border-b-0 min-[40rem]:grid-cols-12 min-[40rem]:items-start min-[40rem]:gap-4 min-[40rem]:px-4 dark:border-gray-800">
      <div className="min-w-0 min-[40rem]:col-span-6">
        <div className="flex flex-col gap-1 min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between min-[40rem]:gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-gray-900 min-[40rem]:min-w-0 min-[40rem]:flex-1 dark:text-white">
            {refItem.title}
          </h3>
          <p className="text-xs leading-snug text-gray-500 min-[40rem]:max-w-[42%] min-[40rem]:shrink-0 min-[40rem]:text-right dark:text-gray-400">
            {categoryLabel}
          </p>
        </div>
        {refItem.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 min-[40rem]:line-clamp-1 dark:text-gray-300">
            {refItem.summary}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <a
            href={refItem.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#FF8A50] hover:underline"
          >
            링크
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            to={`/references/${refItem.id}/edit`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Pencil className="h-3.5 w-3.5" />
            수정
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-[40rem]:col-span-6 min-[40rem]:justify-end min-[40rem]:self-center">
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          <span className="text-gray-400 dark:text-gray-500">원문 </span>
          {formatDateOnly(refItem.written_at, 'iso-date')}
          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
          <span className="text-gray-400 dark:text-gray-500">등록 </span>
          {formatDateTime(refItem.created_at)}
        </span>
        <ActiveBadge active={refItem.is_active} />
      </div>
    </div>
  )
}
