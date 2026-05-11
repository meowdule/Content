import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import type { Category } from '../../types'
import { Button } from '../common/Button'
import { DateRangeControl } from './DateRangeControl'
import { presetLastMonths, presetThisMonth, presetYesterday } from '../../utils/datePresets'

const selectCls =
  'min-w-[7.5rem] rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-[#FF8A50] focus:ring-1 focus:ring-[#FF8A50]/30 dark:border-gray-700 dark:bg-gray-950 dark:text-white'

const groupedSelectCls =
  'min-w-0 flex-1 min-w-[5.5rem] rounded-lg border-0 bg-transparent py-2 pl-2 pr-1 text-sm text-gray-900 outline-none focus:ring-0 dark:text-white'

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="w-12 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400 sm:w-14">
      {children}
    </span>
  )
}

export function ListPageFilters({
  keyword,
  onKeywordChange,
  onSearch,
  parentFilter,
  onParentChange,
  childFilter,
  onChildChange,
  roots,
  childrenCats,
  dateFrom,
  dateTo,
  onDateRangeChange,
  onDatePreset,
  onDateReset,
  activeFilter,
  onActiveChange,
}: {
  keyword: string
  onKeywordChange: (v: string) => void
  onSearch: () => void
  parentFilter: string
  onParentChange: (id: string) => void
  childFilter: string
  onChildChange: (id: string) => void
  roots: Category[]
  childrenCats: Category[]
  dateFrom: string
  dateTo: string
  onDateRangeChange: (from: string, to: string) => void
  onDatePreset: (r: { from: string; to: string }) => void
  onDateReset: () => void
  activeFilter: 'all' | 'active' | 'inactive'
  onActiveChange: (v: 'all' | 'active' | 'inactive') => void
}) {
  const presets = [
    ['전일', presetYesterday],
    ['당월', presetThisMonth],
    ['1개월', () => presetLastMonths(1)],
    ['6개월', () => presetLastMonths(6)],
    ['1년', () => presetLastMonths(12)],
  ] as const

  const childPlaceholder = (() => {
    if (!parentFilter) return '하위: 전체'
    if (childrenCats.length === 0) return '하위 없음'
    return '하위: 전체'
  })()

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 min-[40rem]:flex-row min-[40rem]:items-stretch min-[40rem]:gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 min-[40rem]:shrink-0">
          <FieldLabel>분류</FieldLabel>
          <div
            className="inline-flex min-w-0 max-w-[min(100vw-6rem,28rem)] flex-1 items-stretch rounded-xl border border-gray-200 bg-white shadow-sm min-[40rem]:max-w-none min-[40rem]:flex-none dark:border-gray-700 dark:bg-gray-950 sm:min-w-[18rem]"
            role="group"
            aria-label="상위·하위 분류"
          >
            <select
              className={groupedSelectCls}
              value={parentFilter}
              onChange={(e) => onParentChange(e.target.value)}
              aria-label="상위 카테고리"
            >
              <option value="">상위: 전체</option>
              {roots.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span
              className="flex shrink-0 select-none items-center px-0.5 text-sm font-medium text-gray-400 dark:text-gray-500"
              aria-hidden
            >
              ›
            </span>
            <select
              className={`${groupedSelectCls} disabled:cursor-not-allowed disabled:opacity-45`}
              disabled={!parentFilter || childrenCats.length === 0}
              value={childFilter}
              onChange={(e) => onChildChange(e.target.value)}
              aria-label="하위 카테고리"
            >
              <option value="">{childPlaceholder}</option>
              {childrenCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative min-h-[42px] min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="제목·요약 검색…"
            className="h-full min-h-[42px] w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-24 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#FF8A50] focus:ring-2 focus:ring-[#FF8A50]/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            aria-label="키워드 검색"
          />
          <Button
            type="button"
            variant="outline"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs"
            onClick={onSearch}
          >
            검색
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <FieldLabel>기간</FieldLabel>
        <DateRangeControl
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApply={onDateRangeChange}
          onClear={onDateReset}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map(([label, fn]) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="px-2.5 py-1 text-xs"
              onClick={() => onDatePreset(fn())}
            >
              {label}
            </Button>
          ))}
          <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={onDateReset}>
            초기화
          </Button>
        </div>

        <span
          className="mx-1 hidden h-5 w-px shrink-0 bg-gray-200 min-[40rem]:block dark:bg-gray-700"
          aria-hidden
        />

        <FieldLabel>상태</FieldLabel>
        <select
          className={selectCls}
          value={activeFilter}
          onChange={(e) => onActiveChange(e.target.value as typeof activeFilter)}
          aria-label="활성 상태 필터"
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>
    </div>
  )
}
