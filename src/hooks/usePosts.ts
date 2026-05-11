import { useCallback, useEffect, useState } from 'react'
import type { Post } from '../types'
import * as api from '../api/posts'

export interface PostListFilters {
  keyword?: string
  categoryIds?: string[]
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}

export function usePosts(filters: PostListFilters) {
  const [data, setData] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await api.fetchPosts(filters)
      setData(rows)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [
    filters.keyword,
    filters.categoryIds?.join('|'),
    filters.isActive,
    filters.dateFrom,
    filters.dateTo,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
