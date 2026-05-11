import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Post } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateTime } from '../../utils/formatDate'

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
      className="group grid grid-cols-1 gap-3 border-b border-gray-100 px-3 py-3.5 transition last:border-b-0 hover:bg-orange-50/40 sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-4 dark:border-gray-800 dark:hover:bg-orange-950/20"
    >
      <div className="min-w-0 sm:col-span-7">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-[#FF8A50] dark:text-white">
            {post.title}
          </h3>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{categoryLabel}</p>
        {post.summary ? (
          <p className="mt-1 line-clamp-1 text-sm text-gray-600 dark:text-gray-300">{post.summary}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:col-span-5 sm:justify-end">
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          <span className="text-gray-400 dark:text-gray-500">등록 </span>
          {formatDateTime(post.created_at)}
        </span>
        <ActiveBadge active={post.is_active} />
      </div>
    </Link>
  )
}
