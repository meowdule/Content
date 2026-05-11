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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">상위 카테고리</label>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          value={parentSelectValue}
          onChange={(e) => onParentChange(e.target.value)}
          required={required}
        >
          <option value="">{required ? '선택' : '선택 안 함'}</option>
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">하위 카테고리</label>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          disabled={!parentSelectValue || children.length === 0}
          value={childSelectValue}
          onChange={(e) => onChildChange(e.target.value)}
        >
          <option value="">{children.length ? '선택' : '하위 없음'}</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {showChildHint ? (
        <p className="text-xs text-amber-700 sm:col-span-2 dark:text-amber-300">
          하위 카테고리가 있으면 하위까지 선택해 주세요.
        </p>
      ) : null}
    </div>
  )
}
