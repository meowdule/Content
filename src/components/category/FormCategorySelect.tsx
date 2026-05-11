import { useEffect, useState } from 'react'
import type { Category } from '../../types'
import { selectChildren, selectRootCategories } from '../../store/categoryStore'

export function FormCategorySelect({
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
  const roots = selectRootCategories(categories)
  const current = value ? categories.find((c) => c.id === value) : undefined

  const [pendingParent, setPendingParent] = useState('')

  useEffect(() => {
    if (value) setPendingParent('')
  }, [value])

  const parentSelectValue = current
    ? current.parent_id
      ? current.parent_id
      : current.id
    : pendingParent

  const childSelectValue = current?.parent_id ? current.id : ''

  const children = parentSelectValue
    ? selectChildren(categories, parentSelectValue)
    : []

  const onParentChange = (pid: string) => {
    if (!pid) {
      setPendingParent('')
      onChange(null)
      return
    }
    setPendingParent(pid)
    const subs = selectChildren(categories, pid)
    if (subs.length === 0) onChange(pid)
    else onChange(null)
  }

  const onChildChange = (cid: string) => {
    onChange(cid || null)
  }

  const isRootSelfAssigned = Boolean(
    value && current && !current.parent_id && value === parentSelectValue
  )
  const showChildHint =
    Boolean(parentSelectValue) &&
    children.length > 0 &&
    !childSelectValue &&
    !isRootSelfAssigned

  const selectCls =
    'min-w-0 flex-1 rounded-lg border-0 bg-transparent py-2 pl-2 pr-1 text-sm text-gray-900 outline-none focus:ring-0 dark:text-gray-100'

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</label>
        <div
          className="flex min-w-0 flex-wrap items-stretch gap-0 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:flex-nowrap"
          role="group"
          aria-label="상위·하위 카테고리"
        >
          <select
            className={selectCls}
            value={parentSelectValue}
            onChange={(e) => onParentChange(e.target.value)}
            required={required}
            aria-label="상위 카테고리"
          >
            <option value="">{required ? '상위 선택' : '상위 없음'}</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span
            className="flex shrink-0 select-none items-center px-1 text-sm font-medium text-gray-400 dark:text-gray-500"
            aria-hidden
          >
            ›
          </span>
          <select
            className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-45`}
            disabled={!parentSelectValue || children.length === 0}
            value={childSelectValue}
            onChange={(e) => onChildChange(e.target.value)}
            aria-label="하위 카테고리"
          >
            <option value="">
              {!parentSelectValue
                ? '상위 먼저'
                : children.length === 0
                  ? '하위 없음'
                  : '하위 선택'}
            </option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showChildHint ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          하위 카테고리가 있으면 하위까지 선택해 주세요.
        </p>
      ) : null}
    </div>
  )
}
