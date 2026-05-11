import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useReferences } from '../hooks/useReferences'
import {
  getCategoryBreadcrumb,
  selectChildren,
  selectRootCategories,
  useCategoryStore,
} from '../store/categoryStore'
import { collectDescendantIds } from '../utils/categoryFilter'
import { presetLastMonths, presetThisMonth, presetYesterday } from '../utils/datePresets'
import { ReferenceCard } from '../components/reference/ReferenceCard'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Pagination } from '../components/common/Pagination'

const PAGE_SIZE = 12

export function ReferencesPage() {
  const categories = useCategoryStore((s) => s.categories)

  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [childFilter, setChildFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const categoryIds = useMemo(() => {
    if (childFilter) return [childFilter]
    if (parentFilter) return collectDescendantIds(categories, parentFilter)
    return undefined
  }, [categories, parentFilter, childFilter])

  const isActive =
    activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false

  const { data, loading, error } = useReferences({
    keyword: appliedKeyword,
    categoryIds,
    isActive,
    dateFrom,
    dateTo,
  })

  const roots = useMemo(() => selectRootCategories(categories), [categories])
  const children = useMemo(
    () => (parentFilter ? selectChildren(categories, parentFilter) : []),
    [categories, parentFilter]
  )

  const total = data.length
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
  const slice = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const applySearch = () => {
    setAppliedKeyword(keyword.trim())
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">해외 참고 링크</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">해외 자료 링크를 모아 둡니다.</p>
        </div>
        <Link to="/references/new">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4" />
            등록
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex gap-2">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="제목·요약 검색…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch()
                }}
              />
              <Button type="button" variant="outline" className="shrink-0" onClick={applySearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">상위 카테고리</span>
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                value={parentFilter}
                onChange={(e) => {
                  setParentFilter(e.target.value)
                  setChildFilter('')
                  setPage(1)
                }}
              >
                <option value="">전체</option>
                {roots.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">하위 카테고리</span>
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                disabled={!parentFilter || children.length === 0}
                value={childFilter}
                onChange={(e) => {
                  setChildFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">전체</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">등록일</span>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
          <span className="text-gray-400">~</span>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['전일', presetYesterday],
                ['당월', presetThisMonth],
                ['1개월', () => presetLastMonths(1)],
                ['6개월', () => presetLastMonths(6)],
                ['1년', () => presetLastMonths(12)],
              ] as const
            ).map(([label, fn]) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                className="px-3 py-1 text-xs"
                onClick={() => {
                  const r = fn()
                  setDateFrom(r.from)
                  setDateTo(r.to)
                  setPage(1)
                }}
              >
                {label}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1 text-xs"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setPage(1)
              }}
            >
              초기화
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">상태</span>
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter)
              setPage(1)
            }}
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">표시 중: {total}개</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slice.map((r) => (
              <ReferenceCard
                key={r.id}
                refItem={r}
                categoryLabel={getCategoryBreadcrumb(categories, r.category_id)}
              />
            ))}
          </div>
          {!slice.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">조건에 맞는 링크가 없습니다.</p>
          ) : null}
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      <Link
        to="/references/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8A50] text-white shadow-lg hover:bg-[#ff7a3d] md:hidden"
        aria-label="링크 등록"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  )
}
