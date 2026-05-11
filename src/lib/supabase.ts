import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DEFAULT_ANON_KEY, SUPABASE_DEFAULT_URL } from './supabaseDefaults'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim() || SUPABASE_DEFAULT_URL
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() || SUPABASE_DEFAULT_ANON_KEY

export const supabase = createClient(url, key)

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key)
}
