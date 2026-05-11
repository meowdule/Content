import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePosts } from '../hooks/usePosts'
import {
  getCategoryBreadcrumb,
  selectChildren,
  selectRootCategories,
  useCategoryStore,
} from '../store/categoryStore'
import { collectDescendantIds } from '../utils/categoryFilter'
import { ListPageFilters } from '../components/list/ListPageFilters'
import { PostListRow } from '../components/post/PostListRow'
import { Button } from '../components/common/Button'
import { Pagination } from '../components/common/Pagination'

const PAGE_SIZE = 12

export function PostsPage() {
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

  const { data, loading, error } = usePosts({
    keyword: appliedKeyword,
    categoryIds,
    isActive,
    dateFrom,
    dateTo,
  })

  const roots = useMemo(() => selectRootCategories(categories), [categories])
  const childrenCats = useMemo(
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">게시글</h1>
        </div>
        <Link to="/posts/new">
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
        parentFilter={parentFilter}
        onParentChange={(id) => {
          setParentFilter(id)
          setChildFilter('')
          setPage(1)
        }}
        childFilter={childFilter}
        onChildChange={(id) => {
          setChildFilter(id)
          setPage(1)
        }}
        roots={roots}
        childrenCats={childrenCats}
        dateFrom={dateFrom}
        onDateFromChange={(v) => {
          setDateFrom(v)
          setPage(1)
        }}
        dateTo={dateTo}
        onDateToChange={(v) => {
          setDateTo(v)
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
        toolbarCaption="등록된 게시글을 검색하고 관리합니다."
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
              <div className="min-[40rem]:col-span-7">제목 · 분류 · 요약</div>
              <div className="text-right min-[40rem]:col-span-5">등록일 · 상태</div>
            </div>
            {slice.map((p) => (
              <PostListRow
                key={p.id}
                post={p}
                categoryLabel={getCategoryBreadcrumb(categories, p.category_id)}
              />
            ))}
            {!slice.length ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                조건에 맞는 게시글이 없습니다.
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
        to="/posts/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8A50] text-white shadow-lg hover:bg-[#ff7a3d] md:hidden"
        aria-label="게시글 등록"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  )
}
