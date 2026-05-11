import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useReferences } from '../hooks/useReferences'
import {
  getCategoryBreadcrumb,
  getCategoryIconEmoji,
  useCategoryStore,
} from '../store/categoryStore'
import { collectDescendantIds } from '../utils/categoryFilter'
import { ListPageFilters } from '../components/list/ListPageFilters'
import { ReferenceListRow } from '../components/reference/ReferenceListRow'
import { Button } from '../components/common/Button'
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
        </div>
        <Link to="/references/new">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4" />
            등록
          </Button>
        </Link>
      </div>

      <ListPageFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={applySearch}
        categories={categories}
        parentFilter={parentFilter}
        childFilter={childFilter}
        onCategoryFilterApply={(parentId, childId) => {
          setParentFilter(parentId)
          setChildFilter(childId)
          setPage(1)
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateRangeChange={(from, to) => {
          setDateFrom(from)
          setDateTo(to)
          setPage(1)
        }}
        onDatePreset={(r) => {
          setDateFrom(r.from)
          setDateTo(r.to)
          setPage(1)
        }}
        onDateReset={() => {
          setDateFrom('')
          setDateTo('')
          setPage(1)
        }}
        activeFilter={activeFilter}
        onActiveChange={(v) => {
          setActiveFilter(v)
          setPage(1)
        }}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="hidden border-b border-gray-100 bg-gray-50/90 px-4 py-2.5 text-xs font-medium tracking-wide text-gray-500 min-[40rem]:grid min-[40rem]:grid-cols-12 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-400">
              <div className="min-[40rem]:col-span-8">분류 · 제목 · 요약</div>
              <div className="text-right min-[40rem]:col-span-4">원문일 · 상태 · 작업</div>
            </div>
            {slice.map((r) => (
              <ReferenceListRow
                key={r.id}
                refItem={r}
                categoryLabel={getCategoryBreadcrumb(categories, r.category_id)}
                categoryIcon={getCategoryIconEmoji(categories, r.category_id)}
              />
            ))}
            {!slice.length ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                조건에 맞는 링크가 없습니다.
              </p>
            ) : null}
          </div>
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
