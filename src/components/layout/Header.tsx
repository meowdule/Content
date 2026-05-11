import { NavLink } from 'react-router-dom'
import { FileText, FolderTree, Link2, Moon, Sparkles, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-orange-50 text-[#FF8A50] dark:bg-orange-950/40 dark:text-orange-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`

export function Header() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
    const on = saved === 'dark' || (!saved && prefers)
    setDark(on)
    document.documentElement.classList.toggle('dark', on)
  }, [])

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF8A50] text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>콘텐츠허브</span>
        </NavLink>

        <nav className="flex flex-wrap items-center justify-end gap-1">
          <NavLink to="/references" className={navClass}>
            <Link2 className="h-4 w-4" />
            해외 참고 링크
          </NavLink>
          <NavLink to="/posts" className={navClass}>
            <FileText className="h-4 w-4" />
            게시글
          </NavLink>
          <NavLink to="/categories" className={navClass}>
            <FolderTree className="h-4 w-4" />
            카테고리 관리
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="테마 전환"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </header>
  )
}
