/** 카테고리 id 기준으로 고정 이모지(목록 등에서 짧게 표시) */
const POOL = [
  '📁',
  '📂',
  '🔗',
  '📊',
  '📈',
  '✨',
  '🎯',
  '📚',
  '🗂️',
  '🔖',
  '📝',
  '🧭',
  '💡',
  '🛠️',
  '🎨',
  '🌐',
  '📌',
  '🏷️',
  '📎',
  '🔍',
] as const

export function categoryEmoji(categoryId: string | null | undefined): string {
  if (!categoryId) return '📋'
  let h = 0
  for (let i = 0; i < categoryId.length; i++) {
    h = (h << 5) - h + categoryId.charCodeAt(i)
    h |= 0
  }
  const idx = Math.abs(h) % POOL.length
  return POOL[idx]!
}
