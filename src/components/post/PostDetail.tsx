import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post, Reference } from '../../types'
import { MarkdownBody } from './MarkdownBody'
import { formatDateTime } from '../../utils/formatDate'

const actionBtn =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'

const dangerActionBtn =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/40'

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
  const hasRefs = Boolean(post.reference_links?.length)
  const hasRelated = related.length > 0
  const showSidebar = hasRefs || hasRelated

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
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
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-2 border-t border-gray-100 pt-4 text-gray-600 dark:border-gray-800 dark:text-gray-400 lg:w-52 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 lg:text-right">
          {post.publish_location ? (
            <p className="text-xs leading-snug text-gray-600 dark:text-gray-400">{post.publish_location}</p>
          ) : null}
          <p className="text-[11px] tabular-nums leading-snug text-gray-500 dark:text-gray-500">
            {formatDateTime(post.created_at)}
          </p>
          <div className="flex gap-2 pt-1 lg:justify-end">
            <Link
              to={`/posts/${post.id}/edit`}
              className={actionBtn}
              title="수정"
              aria-label="수정"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.25} />
            </Link>
            <button
              type="button"
              className={dangerActionBtn}
              title="삭제"
              aria-label="삭제"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-950/30 lg:px-6 lg:py-8">
          <MarkdownBody markdown={post.content} />
        </div>

        {showSidebar ? (
          <aside
            className="w-full shrink-0 space-y-6 rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-900/80 lg:sticky lg:top-4 lg:w-72 lg:self-start lg:p-5"
            aria-label="참고 자료"
          >
            {hasRefs ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  참고 링크
                </h2>
                <ul className="mt-2 space-y-2 text-xs leading-snug">
                  {post.reference_links!.map((url) => (
                    <li key={url} className="break-all">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FF8A50] underline-offset-2 hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasRelated ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  연관 해외 레퍼런스
                </h2>
                <div className="mt-2 space-y-3">
                  {related.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700 dark:bg-gray-950/60"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                      {r.summary ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{r.summary}</p>
                      ) : null}
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#FF8A50] hover:underline"
                      >
                        바로가기
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>
    </article>
  )
}
