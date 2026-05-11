import { supabase } from '../lib/supabase'
import type { Reference } from '../types'
import { REFERENCES_TABLE } from './constants'

function sanitizeIlikeFragment(s: string): string {
  return s.trim().replace(/%/g, '').replace(/,/g, '')
}

export async function fetchReferences({
  keyword = '',
  categoryIds,
  isActive,
  dateFrom = '',
  dateTo = '',
}: {
  keyword?: string
  categoryIds?: string[]
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}): Promise<Reference[]> {
  let query = supabase
    .from(REFERENCES_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

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
  return (data ?? []) as Reference[]
}

export async function fetchReferenceById(id: string): Promise<Reference | null> {
  const { data, error } = await supabase
    .from(REFERENCES_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Reference) ?? null
}

export async function fetchReferencesByIds(ids: string[]): Promise<Reference[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from(REFERENCES_TABLE)
    .select('*')
    .in('id', ids)

  if (error) throw error
  return (data ?? []) as Reference[]
}

export async function insertReference(
  row: Omit<Reference, 'id' | 'created_at'>
): Promise<Reference> {
  const { data, error } = await supabase
    .from(REFERENCES_TABLE)
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return data as Reference
}

export async function updateReference(
  id: string,
  row: Partial<Omit<Reference, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from(REFERENCES_TABLE).update(row).eq('id', id)
  if (error) throw error
}

export async function deleteReference(id: string): Promise<void> {
  const { error } = await supabase.from(REFERENCES_TABLE).delete().eq('id', id)
  if (error) throw error
}
