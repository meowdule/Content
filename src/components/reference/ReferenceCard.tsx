import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Reference } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateOnly, formatDateTime } from '../../utils/formatDate'

export function ReferenceCard({
  refItem,
  categoryLabel,
}: {
  refItem: Reference
  categoryLabel: string
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{refItem.title}</h3>
        <ActiveBadge active={refItem.is_active} />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{categoryLabel}</p>
      {refItem.summary ? (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{refItem.summary}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={refItem.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-[#FF8A50] hover:underline"
        >
          링크 열기
          <ExternalLink className="h-4 w-4" />
        </a>
        <Link to={`/references/${refItem.id}/edit`} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          수정
        </Link>
      </div>
      <p className="mt-auto pt-4 text-xs text-gray-400 dark:text-gray-500">
        원문 {formatDateOnly(refItem.written_at, 'iso-date')} · 등록 {formatDateTime(refItem.created_at)}
      </p>
    </div>
  )
}
