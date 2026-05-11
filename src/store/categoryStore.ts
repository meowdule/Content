import { create } from 'zustand'
import type { Category } from '../types'
import * as categoriesApi from '../api/categories'

interface CategoryState {
  categories: Category[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  reset: () => void
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const categories = await categoriesApi.fetchCategories()
      set({ categories, loading: false })
    } catch (e) {
      const message = e instanceof Error ? e.message : '카테고리를 불러오지 못했습니다.'
      set({ error: message, loading: false })
    }
  },

  reset: () => set({ categories: [], loading: false, error: null }),
}))

export function selectRootCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.parent_id === null)
}

export function selectChildren(categories: Category[], parentId: string | null): Category[] {
  return categories.filter((c) => c.parent_id === parentId)
}

export function getCategoryById(categories: Category[], id: string | null): Category | undefined {
  if (!id) return undefined
  return categories.find((c) => c.id === id)
}

export function getCategoryBreadcrumb(
  categories: Category[],
  categoryId: string | null
): string {
  if (!categoryId) return '미분류'
  const map = new Map(categories.map((c) => [c.id, c]))
  const parts: string[] = []
  let cur: Category | undefined = map.get(categoryId)
  let guard = 0
  while (cur && guard++ < 32) {
    parts.unshift(cur.name)
    cur = cur.parent_id ? map.get(cur.parent_id) : undefined
  }
  return parts.length ? parts.join(' > ') : '미분류'
}

/** DB에 저장된 icon_emoji, 없으면 기본 칩 */
export function getCategoryIconEmoji(categories: Category[], categoryId: string | null): string {
  if (!categoryId) return '📋'
  const c = categories.find((x) => x.id === categoryId)
  const raw = c?.icon_emoji?.trim()
  return raw || '📋'
}
