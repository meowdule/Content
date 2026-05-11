import { useCallback, useEffect, useState } from 'react'
import type { Reference } from '../types'
import * as api from '../api/references'

export interface ReferenceListFilters {
  keyword?: string
  categoryIds?: string[]
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}

export function useReferences(filters: ReferenceListFilters) {
  const [data, setData] = useState<Reference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await api.fetchReferences(filters)
      setData(rows)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '링크를 불러오지 못했습니다.')
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
