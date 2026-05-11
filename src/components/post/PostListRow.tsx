import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Post } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateOnly } from '../../utils/formatDate'

export function PostListRow({
  post,
  categoryLabel,
}: {
  post: Post
  categoryLabel: string
}) {
  return (
    <Link
      to={`/posts/${post.id}`}
      className="group grid grid-cols-1 gap-3 border-b border-gray-100 px-3 py-3.5 transition last:border-b-0 hover:bg-orange-50/40 min-[40rem]:grid-cols-12 min-[40rem]:items-center min-[40rem]:gap-4 min-[40rem]:px-4 dark:border-gray-800 dark:hover:bg-orange-950/20"
    >
      <div className="min-w-0 min-[40rem]:col-span-7">
        <div className="flex flex-col gap-1 min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between min-[40rem]:gap-3">
          <div className="flex min-w-0 items-start gap-2 min-[40rem]:min-w-0 min-[40rem]:flex-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-[#FF8A50] dark:text-white">
              {post.title}
            </h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
          </div>
          <p
            className="text-xs leading-snug text-gray-500 break-keep text-pretty min-[40rem]:max-w-[min(46%,15rem)] min-[40rem]:shrink-0 min-[40rem]:text-right dark:text-gray-400"
            title={categoryLabel}
          >
            {categoryLabel}
          </p>
        </div>
        {post.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 min-[40rem]:line-clamp-1 dark:text-gray-300">
            {post.summary}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-[40rem]:col-span-5 min-[40rem]:justify-end">
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {formatDateOnly(post.created_at, 'iso-datetime')}
        </span>
        <ActiveBadge active={post.is_active} />
      </div>
    </Link>
  )
}
