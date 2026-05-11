import { useEffect } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { useCategoryStore } from '../store/categoryStore'

export function useCategoriesBootstrap() {
  const load = useCategoryStore((s) => s.load)
  const loading = useCategoryStore((s) => s.loading)
  const error = useCategoryStore((s) => s.error)
  const categories = useCategoryStore((s) => s.categories)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    void load()
  }, [load])

  return { categories, loading, error, reload: load }
}
