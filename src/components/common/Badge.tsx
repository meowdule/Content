import { CircleSlash, Sparkles } from 'lucide-react'

/** 활성 상태 — 텍스트 대신 Lucide 아이콘(스파클 / 슬래시 원) */
export function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span
        className="inline-flex shrink-0 text-emerald-600 dark:text-emerald-400"
        title="활성"
        aria-label="활성"
      >
        <Sparkles className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
      </span>
    )
  }
  return (
    <span
      className="inline-flex shrink-0 text-gray-400 dark:text-gray-500"
      title="비활성"
      aria-label="비활성"
    >
      <CircleSlash className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
    </span>
  )
}
