import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPostById, deletePost } from '../api/posts'
import { fetchReferencesByIds } from '../api/references'
import type { Post, Reference } from '../types'
import { getCategoryBreadcrumb, getCategoryIconEmoji, useCategoryStore } from '../store/categoryStore'
import { PostDetailView } from '../components/post/PostDetail'
import { Modal } from '../components/common/Modal'
import { Button } from '../components/common/Button'

export function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categories = useCategoryStore((s) => s.categories)

  const [post, setPost] = useState<Post | null>(null)
  const [related, setRelated] = useState<Reference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    fetchPostById(id)
      .then(async (p) => {
        if (cancelled) return
        if (!p) {
          setPost(null)
          setRelated([])
          setError('게시글을 찾을 수 없습니다.')
          return
        }
        setPost(p)
        setError(null)
        const ids = p.related_reference_ids ?? []
        const refs = await fetchReferencesByIds(ids).catch(() => [])
        if (!cancelled) setRelated(refs)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
          setPost(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const onDelete = async () => {
    if (!post) return
    await deletePost(post.id)
    setConfirmOpen(false)
    navigate('/posts')
  }

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중…</p>
  }
  if (!post) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {error ?? '게시글을 찾을 수 없습니다.'}
      </p>
    )
  }

  return (
    <>
      {error ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {error}
        </div>
      ) : null}
      <PostDetailView
        post={post}
        categoryLabel={getCategoryBreadcrumb(categories, post.category_id)}
        categoryIcon={getCategoryIconEmoji(categories, post.category_id)}
        related={related}
        onDelete={() => setConfirmOpen(true)}
      />

      <Modal
        open={confirmOpen}
        title="게시글 삭제"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => void onDelete()}>
              삭제
            </Button>
          </>
        }
      >
        이 게시글을 삭제할까요? 이 작업은 되돌릴 수 없습니다.
      </Modal>
    </>
  )
}
