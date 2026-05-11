import { Link } from 'react-router-dom'
import type { Post } from '../../types'
import { ActiveBadge } from '../common/Badge'
import { formatDateTime } from '../../utils/formatDate'

export function PostCard({
  post,
  categoryLabel,
}: {
  post: Post
  categoryLabel: string
}) {
  return (
    <Link
      to={`/posts/${post.id}`}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-orange-900"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-[#FF8A50] dark:text-white">
          {post.title}
        </h3>
        <ActiveBadge active={post.is_active} />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{categoryLabel}</p>
      {post.summary ? (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{post.summary}</p>
      ) : null}
      <p className="mt-auto pt-4 text-xs text-gray-400 dark:text-gray-500">
        등록 {formatDateTime(post.created_at)}
      </p>
    </Link>
  )
}
