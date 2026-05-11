import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPostById } from '../api/posts'
import type { Post } from '../types'
import { PostForm } from '../components/post/PostForm'

export function PostFormPage() {
  const { id } = useParams()
  const isNew = !id

  const [initial, setInitial] = useState<Post | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) {
      setInitial(null)
      setLoading(false)
      setNotFound(false)
      return
    }
    if (!id) return

    let cancelled = false
    setLoading(true)
    fetchPostById(id)
      .then((p) => {
        if (cancelled) return
        if (!p) {
          setNotFound(true)
          setInitial(null)
        } else {
          setNotFound(false)
          setInitial(p)
        }
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '오류')
          setNotFound(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  if (!isNew && loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중…</p>
  }
  if (!isNew && error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  }
  if (!isNew && notFound) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">게시글을 찾을 수 없습니다.</p>
  }

  return <PostForm initial={isNew ? null : initial} />
}
