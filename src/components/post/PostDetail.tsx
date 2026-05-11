import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post, Reference } from '../../types'
import { MarkdownBody } from './MarkdownBody'
import { formatDateTime } from '../../utils/formatDate'

export function PostDetailView({
  post,
  categoryLabel,
  categoryIcon,
  related,
  onDelete,
}: {
  post: Post
  categoryLabel: string
  categoryIcon: string
  related: Reference[]
  onDelete: () => void
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span className="text-lg leading-none" title={categoryLabel} aria-hidden>
          {categoryIcon}
        </span>
        <span className="font-medium text-gray-800 dark:text-gray-100">{categoryLabel}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold leading-snug text-gray-900 dark:text-white">{post.title}</h1>

      {post.summary ? (
        <p className="mt-3 text-base leading-relaxed text-gray-700 dark:text-gray-200">{post.summary}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
          {post.publish_location ? (
            <p>
              <span className="font-medium text-gray-800 dark:text-gray-100">게시 위치</span>{' '}
              {post.publish_location}
            </p>
          ) : null}
          <p className="text-xs text-gray-500 dark:text-gray-400">등록 {formatDateTime(post.created_at)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Link
            to={`/posts/${post.id}/edit`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            title="수정"
            aria-label="수정"
          >
            <Pencil className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            title="삭제"
            aria-label="삭제"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
        <MarkdownBody markdown={post.content} />
      </div>

      {post.reference_links?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">참고 링크</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
            {post.reference_links.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FF8A50] hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">연관 해외 레퍼런스</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50"
              >
                <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
                {r.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{r.summary}</p>
                ) : null}
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#FF8A50] hover:underline"
                >
                  바로가기
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
