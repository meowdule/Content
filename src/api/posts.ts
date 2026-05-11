import { supabase } from '../lib/supabase'
import type { Post } from '../types'

function sanitizeIlikeFragment(s: string): string {
  return s.trim().replace(/%/g, '').replace(/,/g, '')
}

export async function fetchPosts({
  keyword = '',
  categoryIds,
  isActive,
  dateFrom = '',
  dateTo = '',
}: {
  keyword?: string
  /** 비어 있지 않으면 해당 ID들 중 하나와 일치하는 행만 (상위만 고를 때는 하위 ID 포함해서 전달) */
  categoryIds?: string[]
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}): Promise<Post[]> {
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false })

  if (keyword) {
    const q = sanitizeIlikeFragment(keyword)
    if (q) {
      query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    }
  }
  if (categoryIds && categoryIds.length === 1) {
    query = query.eq('category_id', categoryIds[0]!)
  } else if (categoryIds && categoryIds.length > 1) {
    query = query.in('category_id', categoryIds)
  }
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Post[]
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return (data as Post) ?? null
}

export async function insertPost(row: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
  const { data, error } = await supabase.from('posts').insert(row).select().single()

  if (error) throw error
  return data as Post
}

export async function updatePost(
  id: string,
  row: Partial<Omit<Post, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from('posts').update(row).eq('id', id)
  if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}
