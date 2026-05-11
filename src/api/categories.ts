import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import { REFERENCES_TABLE } from './constants'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*')
  if (error) throw error
  const list = (data ?? []) as Category[]
  return list.sort((a, b) => {
    const pa = a.parent_id ?? ''
    const pb = b.parent_id ?? ''
    if (pa !== pb) return pa.localeCompare(pb)
    if (a.order_num !== b.order_num) return a.order_num - b.order_num
    return a.name.localeCompare(b.name)
  })
}

export async function createCategory(input: {
  name: string
  parent_id: string | null
  order_num?: number
}): Promise<Category> {
  let order_num = input.order_num
  if (order_num === undefined) {
    const siblings = await fetchCategories()
    const max = siblings
      .filter((c) => c.parent_id === input.parent_id)
      .reduce((m, c) => Math.max(m, c.order_num), -1)
    order_num = max + 1
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      parent_id: input.parent_id,
      order_num,
    })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'parent_id' | 'order_num'>>
): Promise<void> {
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function countCategoryUsage(categoryId: string): Promise<number> {
  const [postsRes, refsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId),
    supabase
      .from(REFERENCES_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId),
  ])

  if (postsRes.error) throw postsRes.error
  if (refsRes.error) throw refsRes.error

  return (postsRes.count ?? 0) + (refsRes.count ?? 0)
}

/** 같은 parent_id 그룹에서 위/아래로 순서 이동 */
export async function moveCategory(categoryId: string, direction: 'up' | 'down'): Promise<void> {
  const all = await fetchCategories()
  const cat = all.find((c) => c.id === categoryId)
  if (!cat) return

  const siblings = all
    .filter((c) => c.parent_id === cat.parent_id)
    .sort((a, b) => a.order_num - b.order_num || a.name.localeCompare(b.name))

  const idx = siblings.findIndex((c) => c.id === categoryId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return

  const next = [...siblings]
  const [item] = next.splice(idx, 1)
  next.splice(swapIdx, 0, item!)

  const results = await Promise.all(
    next.map((c, i) =>
      supabase.from('categories').update({ order_num: i }).eq('id', c.id)
    )
  )
  for (const res of results) {
    if (res.error) throw res.error
  }
}
