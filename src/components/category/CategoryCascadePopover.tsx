import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Category } from '../../types'
import { getCategoryBreadcrumb, selectChildren, selectRootCategories } from '../../store/categoryStore'
import { Button } from '../common/Button'

function splitCategoryValue(categories: Category[], value: string | null): {
  parent: string
  child: string
} {
  if (!value) return { parent: '', child: '' }
  const cur = categories.find((c) => c.id === value)
  if (!cur) return { parent: '', child: '' }
  if (cur.parent_id) return { parent: cur.parent_id, child: cur.id }
  return { parent: cur.id, child: '' }
}

function filterSummary(categories: Category[], parentId: string, childId: string): string {
  if (!parentId) return '분류: 전체'
  const p = categories.find((c) => c.id === parentId)
  if (!p) return '분류'
  const under = selectChildren(categories, parentId)
  if (under.length === 0) return `분류: ${p.name}`
  if (!childId) return `분류: ${p.name} (하위 전체)`
  const ch = categories.find((c) => c.id === childId)
  return ch ? `분류: ${p.name} › ${ch.name}` : `분류: ${p.name}`
}

const optBase =
  'w-full rounded-lg px-2.5 py-2 text-left text-sm transition border border-transparent'
const optIdle = 'text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800'
const optActive = 'border-[#FF8A50]/50 bg-orange-50 font-medium text-gray-900 dark:bg-orange-950/40 dark:text-white'

type CascadePanelProps = {
  categories: Category[]
  roots: Category[]
  draftParent: string
  draftChild: string
  setDraftParent: (id: string) => void
  setDraftChild: (id: string) => void
  /** 필터: 전체 / 폼(선택): 선택 안 함 */
  topLeftOption?: 'filter-all' | 'form-clear'
  rightHintNoParent: string
}

function CascadePanel({
  categories,
  roots,
  draftParent,
  draftChild,
  setDraftParent,
  setDraftChild,
  topLeftOption,
  rightHintNoParent,
}: CascadePanelProps) {
  const subs = draftParent ? selectChildren(categories, draftParent) : []

  const topLabel = topLeftOption === 'filter-all' ? '전체' : topLeftOption === 'form-clear' ? '선택 안 함' : null

  return (
    <div className="flex max-h-[min(70vh,22rem)] min-h-[12rem] divide-x divide-gray-200 dark:divide-gray-700">
      <div
        className="flex w-[min(50%,11rem)] min-w-[9.5rem] flex-col gap-0.5 overflow-y-auto p-2"
        role="listbox"
        aria-label="상위 카테고리"
      >
        {topLabel ? (
          <button
            type="button"
            className={`${optBase} ${!draftParent ? optActive : optIdle}`}
            onClick={() => {
              setDraftParent('')
              setDraftChild('')
            }}
          >
            {topLabel}
          </button>
        ) : null}
        {roots.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`${optBase} ${draftParent === r.id ? optActive : optIdle}`}
            onClick={() => {
              setDraftParent(r.id)
              setDraftChild('')
            }}
          >
            <span className="line-clamp-2">{r.name}</span>
          </button>
        ))}
      </div>
      <div
        className="flex min-w-[9.5rem] flex-1 flex-col gap-0.5 overflow-y-auto p-2"
        role="listbox"
        aria-label="하위 카테고리"
      >
        {!draftParent ? (
          <p className="px-1 py-4 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {rightHintNoParent}
          </p>
        ) : subs.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            하위 카테고리가 없습니다.
            <br />
            <span className="text-gray-600 dark:text-gray-300">적용 시 이 상위만 선택됩니다.</span>
          </p>
        ) : (
          <>
            <button
              type="button"
              className={`${optBase} ${!draftChild ? optActive : optIdle}`}
              onClick={() => setDraftChild('')}
            >
              하위: 전체
            </button>
            {subs.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${optBase} ${draftChild === s.id ? optActive : optIdle}`}
                onClick={() => setDraftChild(s.id)}
              >
                <span className="line-clamp-2">{s.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

/** 목록 필터: 한 번에 열리는 상위·하위 패널 */
export function CategoryFilterCascadeButton({
  categories,
  parentFilter,
  childFilter,
  onApply,
}: {
  categories: Category[]
  parentFilter: string
  childFilter: string
  onApply: (parentId: string, childId: string) => void
}) {
  const roots = useMemo(() => selectRootCategories(categories), [categories])
  const [open, setOpen] = useState(false)
  const [draftP, setDraftP] = useState(parentFilter)
  const [draftC, setDraftC] = useState(childFilter)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDraftP(parentFilter)
    setDraftC(childFilter)
  }, [open, parentFilter, childFilter])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const summary = filterSummary(categories, parentFilter, childFilter)

  const apply = () => {
    onApply(draftP, draftC)
    setOpen(false)
  }

  return (
    <div className="relative inline-block min-w-0 max-w-full" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-[12rem] max-w-[min(100vw-4rem,24rem)] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none hover:border-[#FF8A50]/60 focus:border-[#FF8A50] focus:ring-2 focus:ring-[#FF8A50]/25 dark:border-gray-700 dark:bg-gray-950 dark:text-white min-[40rem]:w-auto"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-[min(100vw-1rem,22rem)] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:w-[min(100vw-1rem,28rem)]"
          role="dialog"
          aria-label="분류 선택"
        >
          <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            상위와 하위를 한 패널에서 함께 고른 뒤 적용하세요.
          </p>
          <CascadePanel
            categories={categories}
            roots={roots}
            draftParent={draftP}
            draftChild={draftC}
            setDraftParent={setDraftP}
            setDraftChild={setDraftC}
            topLeftOption="filter-all"
            rightHintNoParent="왼쪽에서 상위 분류를 선택하면 오른쪽에 하위가 함께 표시됩니다."
          />
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 p-2 dark:border-gray-800">
            <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="button" className="text-xs" onClick={apply}>
              적용
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** 폼용: 동일 패널로 카테고리 id 하나를 선택 */
export function FormCategoryCascadeSelect({
  categories,
  value,
  onChange,
  required,
}: {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string | null) => void
  required?: boolean
}) {
  const roots = useMemo(() => selectRootCategories(categories), [categories])
  const [open, setOpen] = useState(false)
  const [draftP, setDraftP] = useState('')
  const [draftC, setDraftC] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const { parent, child } = splitCategoryValue(categories, value)
    setDraftP(parent)
    setDraftC(child)
    setHint(null)
  }, [open, value, categories])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const summary = value
    ? getCategoryBreadcrumb(categories, value)
    : required
      ? '카테고리를 선택하세요'
      : '카테고리 (선택 안 함)'

  const apply = () => {
    setHint(null)
    if (!draftP) {
      if (required) {
        setHint('상위 카테고리를 선택해 주세요.')
        return
      }
      onChange(null)
      setOpen(false)
      return
    }
    const subs = selectChildren(categories, draftP)
    if (subs.length > 0 && !draftC) {
      setHint('하위 카테고리가 있으면 하위까지 선택해 주세요.')
      return
    }
    onChange(subs.length && draftC ? draftC : draftP)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</label>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none hover:border-[#FF8A50]/60 focus:border-[#FF8A50] focus:ring-2 focus:ring-[#FF8A50]/25 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="min-w-0 flex-1 truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </button>

        {open ? (
          <div
            className="absolute left-0 top-full z-40 mt-1 w-full min-w-[min(100vw-2rem,28rem)] max-w-[min(100vw-1rem,32rem)] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-label="카테고리 선택"
          >
            <p className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              상위를 고르면 오른쪽에 하위가 같이 나타납니다.
            </p>
            <CascadePanel
              categories={categories}
              roots={roots}
              draftParent={draftP}
              draftChild={draftC}
              setDraftParent={setDraftP}
              setDraftChild={setDraftC}
              topLeftOption={required ? undefined : 'form-clear'}
              rightHintNoParent="왼쪽에서 상위를 선택하면 오른쪽에 하위가 함께 표시됩니다."
            />
            {hint ? (
              <p className="border-t border-gray-100 px-3 py-2 text-xs text-amber-700 dark:border-gray-800 dark:text-amber-300">
                {hint}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 p-2 dark:border-gray-800">
              <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button" className="text-xs" onClick={apply}>
                적용
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
