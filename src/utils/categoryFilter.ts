import type { Category } from '../types'

/** rootId와 그 모든 하위 카테고리 id (본인 포함) */
export function collectDescendantIds(categories: Category[], rootId: string): string[] {
  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const k = c.parent_id
    const arr = byParent.get(k) ?? []
    arr.push(c)
    byParent.set(k, arr)
  }
  const out: string[] = []
  const walk = (id: string) => {
    out.push(id)
    const kids = byParent.get(id) ?? []
    for (const ch of kids) walk(ch.id)
  }
  walk(rootId)
  return out
}
