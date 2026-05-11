import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Reference } from '../../types'
import { insertReference, updateReference } from '../../api/references'
import { useCategoryStore } from '../../store/categoryStore'
import { FormCategorySelect } from '../category/FormCategorySelect'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Toggle } from '../common/Toggle'
import { isValidHttpUrl } from '../../utils/validateUrl'
import { formatDateTime } from '../../utils/formatDate'

export function ReferenceForm({ initial }: { initial: Reference | null }) {
  const navigate = useNavigate()
  const categories = useCategoryStore((s) => s.categories)
  const reloadCategories = useCategoryStore((s) => s.load)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [link, setLink] = useState(initial?.link ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null)
  const [writtenAt, setWrittenAt] = useState(initial?.written_at?.slice(0, 10) ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void reloadCategories()
  }, [reloadCategories])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    if (!isValidHttpUrl(link)) {
      setError('올바른 http(s) URL을 입력해 주세요.')
      return
    }
    if (!categoryId) {
      setError('카테고리를 선택해 주세요.')
      return
    }

    setSaving(true)
    try {
      const row = {
        title: title.trim(),
        link: link.trim(),
        category_id: categoryId,
        written_at: writtenAt ? writtenAt : null,
        summary: summary.trim() || null,
        is_active: isActive,
      }
      if (initial) {
        await updateReference(initial.id, row)
        navigate('/references')
      } else {
        await insertReference(row as Omit<Reference, 'id' | 'created_at'>)
        navigate('/references')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {initial ? '해외 참고 링크 수정' : '해외 참고 링크 등록'}
      </h1>
      {initial ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          등록일 <span className="tabular-nums">{formatDateTime(initial.created_at)}</span>
          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
          목록에는 원문 작성일만 표시됩니다.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input label="링크 URL" value={link} onChange={(e) => setLink(e.target.value)} required />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</span>
        <FormCategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          required
        />
      </div>

      <Input
        label="원문 작성일"
        type="date"
        value={writtenAt}
        onChange={(e) => setWrittenAt(e.target.value)}
      />
      <Input label="한줄요약" value={summary} onChange={(e) => setSummary(e.target.value)} />

      <Toggle checked={isActive} onChange={setIsActive} label="활성 상태" />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          취소
        </Button>
      </div>
    </form>
  )
}
