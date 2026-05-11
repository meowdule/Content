import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post, Reference } from '../../types'
import { MarkdownBody } from './MarkdownBody'
import { formatDateTime } from '../../utils/formatDate'
import { Button } from '../common/Button'

export function PostDetailView({
  post,
  categoryLabel,
  related,
  onDelete,
}: {
  post: Post
  categoryLabel: string
  related: Reference[]
  onDelete: () => void
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{categoryLabel}</p>
          {post.summary ? (
            <p className="mt-3 text-base text-gray-700 dark:text-gray-200">{post.summary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/posts/${post.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
          <Button variant="danger" onClick={onDelete}>
            삭제
          </Button>
        </div>
      </div>

      {post.publish_location ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-gray-100">게시 위치</span>{' '}
          {post.publish_location}
        </p>
      ) : null}

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">등록 {formatDateTime(post.created_at)}</p>

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
