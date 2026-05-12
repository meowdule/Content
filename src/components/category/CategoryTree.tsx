import { useEffect, useState } from 'react'
import { MoveDown, MoveUp, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category } from '../../types'
import { selectChildren, selectRootCategories } from '../../store/categoryStore'
import { Button } from '../common/Button'

/** 수정·순서 이동: 테두리 없음 */
const treeGhostBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'

/** 하위 추가 등: 살짝 구분 */
const treeIconBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800'

const treeDangerBtn =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/60 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/50'

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

  return (
    <div>
      <div className="group flex flex-wrap items-center gap-1.5 rounded-md py-1.5 pr-1 hover:bg-gray-50/90 dark:hover:bg-gray-800/40">
        {depth > 0 ? (
          <span
            className="mr-0.5 shrink-0 select-none font-mono text-[11px] leading-none text-gray-400 dark:text-gray-500"
            aria-hidden
          >
            └
          </span>
        ) : null}

        {editing ? (
          <>
            <input
              type="text"
              inputMode="text"
              maxLength={16}
              placeholder="📋"
              title="목록에 쓰일 이모지"
              className="w-11 shrink-0 rounded-md border border-gray-200 px-1 py-1 text-center text-sm leading-tight dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              aria-label="표시 이모지"
            />
            <input
              className="min-w-[6rem] flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
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
              className="inline-flex min-w-[1.5rem] shrink-0 select-none items-center justify-center text-base leading-none"
              title="목록 표시 아이콘"
              aria-hidden
            >
              {displayEmoji}
            </span>
            <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </span>
            <button
              type="button"
              className={treeGhostBtn}
              title="이름·이모지 수정"
              aria-label="이름·이모지 수정"
              onClick={() => {
                setName(category.name)
                setIconEmoji(category.icon_emoji ?? '')
                setEditing(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={treeIconBtn}
              title="하위 카테고리 추가"
              aria-label="하위 카테고리 추가"
              onClick={() => onAddChild(category.id)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={`${treeGhostBtn} disabled:pointer-events-none disabled:opacity-35`}
              disabled={idx <= 0}
              title="위로 이동"
              aria-label="위로 이동"
              onClick={() => void onMove(category.id, 'up')}
            >
              <MoveUp className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={`${treeGhostBtn} disabled:pointer-events-none disabled:opacity-35`}
              disabled={idx < 0 || idx >= siblings.length - 1}
              title="아래로 이동"
              aria-label="아래로 이동"
              onClick={() => void onMove(category.id, 'down')}
            >
              <MoveDown className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className={treeDangerBtn}
              title="삭제"
              aria-label="삭제"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </>
        )}
      </div>

      {children.length > 0 ? (
        <div className="ml-1.5 mt-0.5 border-l border-gray-200 pl-2.5 dark:border-gray-700 sm:ml-2 sm:pl-3">
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
      ) : null}
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
    <div className="space-y-0.5 text-[13px] leading-normal">
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
        <p className="font-sans text-sm text-gray-500 dark:text-gray-400">등록된 상위 카테고리가 없습니다.</p>
      ) : null}
    </div>
  )
}
