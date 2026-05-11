import { useEffect, useState } from 'react'
import { MoveDown, MoveUp, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category } from '../../types'
import { selectChildren, selectRootCategories } from '../../store/categoryStore'
import { Button } from '../common/Button'

const iconBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'

const dangerIconBtn =
  'inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'

function Row({
  category,
  all,
  depth,
  onAddChild,
  onSaveCategory,
  onDelete,
  onMove,
}: {
  category: Category
  all: Category[]
  depth: number
  onAddChild: (parentId: string) => void
  onSaveCategory: (
    id: string,
    patch: { name: string; icon_emoji: string | null }
  ) => Promise<void> | void
  onDelete: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [iconEmoji, setIconEmoji] = useState(category.icon_emoji ?? '')

  useEffect(() => {
    setName(category.name)
    setIconEmoji(category.icon_emoji ?? '')
  }, [category.id, category.name, category.icon_emoji])

  const children = selectChildren(all, category.id)
  const siblings = selectChildren(all, category.parent_id).sort(
    (a, b) => a.order_num - b.order_num || a.name.localeCompare(b.name)
  )
  const idx = siblings.findIndex((s) => s.id === category.id)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await onSaveCategory(category.id, {
      name: trimmed,
      icon_emoji: iconEmoji.trim() || null,
    })
    setEditing(false)
  }

  const displayEmoji = category.icon_emoji?.trim() || '📋'
  const isRoot = depth === 0

  const rowVisual = isRoot
    ? 'border border-orange-100/90 bg-gradient-to-r from-orange-50/95 via-white to-white shadow-sm dark:border-orange-900/35 dark:from-orange-950/35 dark:via-gray-900 dark:to-gray-900'
    : 'border border-gray-100 bg-white/95 pl-2 shadow-sm dark:border-gray-800 dark:bg-gray-950/90'

  const leftAccent = !isRoot ? 'border-l-[3px] border-l-[#FF8A50]/55' : ''

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 ${rowVisual} ${leftAccent}`}
        style={{ marginLeft: depth * 14 }}
      >
        {isRoot ? (
          <span className="shrink-0 rounded-md bg-orange-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-900 dark:bg-orange-900/50 dark:text-orange-100">
            상위
          </span>
        ) : (
          <span className="shrink-0 rounded-md bg-gray-200/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            하위
          </span>
        )}
        {editing ? (
          <>
            <input
              type="text"
              inputMode="text"
              maxLength={16}
              placeholder="📋"
              title="목록에 쓰일 이모지"
              className="w-12 shrink-0 rounded-lg border border-gray-200 px-1 py-1 text-center text-base leading-tight dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              aria-label="표시 이모지"
            />
            <input
              className="min-w-[8rem] flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="카테고리 이름"
            />
            <Button type="button" className="px-2 py-1 text-xs" onClick={() => void save()}>
              저장
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-2 py-1 text-xs"
              onClick={() => {
                setName(category.name)
                setIconEmoji(category.icon_emoji ?? '')
                setEditing(false)
              }}
            >
              취소
            </Button>
          </>
        ) : (
          <>
            <span
              className="inline-flex min-w-[1.75rem] shrink-0 select-none items-center justify-center text-lg leading-none"
              title="목록 표시 아이콘"
              aria-hidden
            >
              {displayEmoji}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 min-w-0 shrink-0 p-0"
              aria-label="이름·이모지 수정"
              onClick={() => {
                setName(category.name)
                setIconEmoji(category.icon_emoji ?? '')
                setEditing(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <button
              type="button"
              className={iconBtn}
              title="하위 카테고리 추가"
              aria-label="하위 카테고리 추가"
              onClick={() => onAddChild(category.id)}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={`${iconBtn} disabled:pointer-events-none disabled:opacity-30`}
              disabled={idx <= 0}
              title="위로 이동"
              aria-label="위로 이동"
              onClick={() => void onMove(category.id, 'up')}
            >
              <MoveUp className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={`${iconBtn} disabled:pointer-events-none disabled:opacity-30`}
              disabled={idx < 0 || idx >= siblings.length - 1}
              title="아래로 이동"
              aria-label="아래로 이동"
              onClick={() => void onMove(category.id, 'down')}
            >
              <MoveDown className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={dangerIconBtn}
              title="삭제"
              aria-label="삭제"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </>
        )}
      </div>
      {children.map((ch) => (
        <Row
          key={ch.id}
          category={ch}
          all={all}
          depth={depth + 1}
          onAddChild={onAddChild}
          onSaveCategory={onSaveCategory}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </div>
  )
}

export function CategoryTree({
  categories,
  onAddChild,
  onSaveCategory,
  onDelete,
  onMove,
}: {
  categories: Category[]
  onAddChild: (parentId: string) => void
  onSaveCategory: (
    id: string,
    patch: { name: string; icon_emoji: string | null }
  ) => Promise<void> | void
  onDelete: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => Promise<void> | void
}) {
  const roots = selectRootCategories(categories)
  return (
    <div className="space-y-3">
      {roots.map((c) => (
        <Row
          key={c.id}
          category={c}
          all={categories}
          depth={0}
          onAddChild={onAddChild}
          onSaveCategory={onSaveCategory}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
      {!roots.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">등록된 상위 카테고리가 없습니다.</p>
      ) : null}
    </div>
  )
}
