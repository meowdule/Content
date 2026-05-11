import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useCategoriesBootstrap } from '../../hooks/useCategories'

export function Layout() {
  useCategoriesBootstrap()
  const ok = isSupabaseConfigured()

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      {!ok ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <code className="rounded bg-white/60 px-1 dark:bg-black/30">.env</code>에{' '}
          <code className="rounded bg-white/60 px-1 dark:bg-black/30">VITE_SUPABASE_URL</code>,{' '}
          <code className="rounded bg-white/60 px-1 dark:bg-black/30">VITE_SUPABASE_ANON_KEY</code>를
          설정한 뒤 다시 실행하세요.
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
