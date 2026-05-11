import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import type { Post, Reference } from '../../types'
import { insertPost, updatePost } from '../../api/posts'
import { fetchReferences } from '../../api/references'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useCategoryStore } from '../../store/categoryStore'
import { FormCategorySelect } from '../category/FormCategorySelect'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Toggle } from '../common/Toggle'
import { isValidHttpUrl } from '../../utils/validateUrl'

function useMdColorMode(): 'light' | 'dark' {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => {
      setMode(el.classList.contains('dark') ? 'dark' : 'light')
    })
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return mode
}

export function PostForm({
  initial,
}: {
  initial: Post | null
}) {
  const navigate = useNavigate()
  const categories = useCategoryStore((s) => s.categories)
  const reloadCategories = useCategoryStore((s) => s.load)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null)
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [referenceLinks, setReferenceLinks] = useState<string[]>(initial?.reference_links?.length ? initial.reference_links : [''])
  const [publishLocation, setPublishLocation] = useState(initial?.publish_location ?? '')
  const [relatedIds, setRelatedIds] = useState<string[]>(initial?.related_reference_ids ?? [])
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [refSearch, setRefSearch] = useState('')
  const [allRefs, setAllRefs] = useState<Reference[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mdMode = useMdColorMode()

  useEffect(() => {
    void reloadCategories()
  }, [reloadCategories])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    fetchReferences({})
      .then(setAllRefs)
      .catch(() => setAllRefs([]))
  }, [])

  const filteredRefs = useMemo(() => {
    const q = refSearch.trim().toLowerCase()
    if (!q) return allRefs
    return allRefs.filter(
      (r) =>
        r.title.toLowerCase().includes(q) || (r.summary ?? '').toLowerCase().includes(q)
    )
  }, [allRefs, refSearch])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    if (!categoryId) {
      setError('카테고리를 선택해 주세요.')
      return
    }
    if (!content.trim()) {
      setError('본문을 입력해 주세요.')
      return
    }

    const links = referenceLinks.map((s) => s.trim()).filter(Boolean)
    for (const u of links) {
      if (!isValidHttpUrl(u)) {
        setError(`참고 링크 URL이 올바르지 않습니다: ${u}`)
        return
      }
    }

    setSaving(true)
    try {
      const row = {
        title: title.trim(),
        content,
        category_id: categoryId,
        summary: summary.trim() || null,
        reference_links: links,
        publish_location: publishLocation.trim() || null,
        related_reference_ids: relatedIds,
        is_active: isActive,
      }

      if (initial) {
        await updatePost(initial.id, row)
        navigate(`/posts/${initial.id}`)
      } else {
        const created = await insertPost(row as Omit<Post, 'id' | 'created_at'>)
        navigate(`/posts/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const toggleRelated = (id: string) => {
    setRelatedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {initial ? '게시글 수정' : '게시글 등록'}
      </h1>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">카테고리</span>
        <FormCategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          required
        />
      </div>

      <Input label="한줄요약" value={summary} onChange={(e) => setSummary(e.target.value)} />

      <div className="flex flex-col gap-2" data-color-mode={mdMode}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">내용 (Markdown)</span>
        <MDEditor value={content} onChange={(v) => setContent(v ?? '')} height={420} preview="edit" />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">참고 링크</span>
        {referenceLinks.map((line, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={line}
              onChange={(e) => {
                const next = [...referenceLinks]
                next[idx] = e.target.value
                setReferenceLinks(next)
              }}
              placeholder="https://"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setReferenceLinks(referenceLinks.filter((_, i) => i !== idx))}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setReferenceLinks([...referenceLinks, ''])}>
          링크 추가
        </Button>
      </div>

      <Input
        label="게시 위치"
        value={publishLocation}
        onChange={(e) => setPublishLocation(e.target.value)}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">연관 해외 레퍼런스</span>
        <Input
          value={refSearch}
          onChange={(e) => setRefSearch(e.target.value)}
          placeholder="제목·요약 검색…"
        />
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          {filteredRefs.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={relatedIds.includes(r.id)}
                onChange={() => toggleRelated(r.id)}
              />
              <span>
                <span className="font-medium text-gray-900 dark:text-white">{r.title}</span>
                {r.summary ? (
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{r.summary}</span>
                ) : null}
              </span>
            </label>
          ))}
          {!filteredRefs.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">표시할 레퍼런스가 없습니다.</p>
          ) : null}
        </div>
      </div>

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
