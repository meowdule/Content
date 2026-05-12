import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  countCategoryUsage,
  moveCategory,
} from '../api/categories'
import { useCategoryStore } from '../store/categoryStore'
import { CategoryTree } from '../components/category/CategoryTree'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { Input } from '../components/common/Input'

type NameModal =
  | null
  | { mode: 'root' }
  | { mode: 'child'; parentId: string }

export function CategoriesPage() {
  const categories = useCategoryStore((s) => s.categories)
  const reload = useCategoryStore((s) => s.load)

  const [nameModal, setNameModal] = useState<NameModal>(null)
  const [draftName, setDraftName] = useState('')
  const [draftEmoji, setDraftEmoji] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ id: string; count: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const closeNameModal = () => {
    setNameModal(null)
    setDraftName('')
    setDraftEmoji('')
  }

  const submitName = async () => {
    const name = draftName.trim()
    if (!name || !nameModal) return
    const icon_emoji = draftEmoji.trim() || null
    setBusy(true)
    try {
      if (nameModal.mode === 'root') {
        await createCategory({ name, parent_id: null, icon_emoji })
      } else {
        await createCategory({ name, parent_id: nameModal.parentId, icon_emoji })
      }
      await reload()
      closeNameModal()
    } finally {
      setBusy(false)
    }
  }

  const onSaveCategory = async (
    id: string,
    patch: { name: string; icon_emoji: string | null }
  ) => {
    await updateCategory(id, patch)
    await reload()
  }

  const onAddChild = (parentId: string) => {
    setDraftName('')
    setDraftEmoji('')
    setNameModal({ mode: 'child', parentId })
  }

  const onDeleteRequest = async (id: string) => {
    const count = await countCategoryUsage(id)
    setDeleteModal({ id, count })
  }

  const confirmDelete = async () => {
    if (!deleteModal) return
    setBusy(true)
    try {
      await deleteCategory(deleteModal.id)
      await reload()
      setDeleteModal(null)
    } finally {
      setBusy(false)
    }
  }

  const onMove = async (categoryId: string, dir: 'up' | 'down') => {
    await moveCategory(categoryId, dir)
    await reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            상위·하위 구조로 정리하고 순서를 조정합니다.
          </p>
        </div>
        <Button
          onClick={() => {
            setDraftName('')
            setDraftEmoji('')
            setNameModal({ mode: 'root' })
          }}
          className="h-11 w-11 min-w-0 shrink-0 p-0 shadow-sm"
          title="상위 카테고리 추가"
          aria-label="상위 카테고리 추가"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <CategoryTree
          categories={categories}
          onAddChild={onAddChild}
          onSaveCategory={onSaveCategory}
          onDelete={onDeleteRequest}
          onMove={onMove}
        />
      </div>

      <Modal
        open={Boolean(nameModal)}
        title={nameModal?.mode === 'root' ? '상위 카테고리 추가' : '하위 카테고리 추가'}
        onClose={closeNameModal}
        footer={
          <>
            <Button variant="outline" onClick={closeNameModal} disabled={busy}>
              취소
            </Button>
            <Button onClick={() => void submitName()} disabled={busy || !draftName.trim()}>
              {busy ? '처리 중…' : '추가'}
            </Button>
          </>
        }
      >
        <Input
          label="카테고리 이름"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          autoFocus
        />
        <Input
          label="목록 표시 이모지 (선택)"
          value={draftEmoji}
          onChange={(e) => setDraftEmoji(e.target.value)}
          placeholder="예: 📁"
          maxLength={16}
        />
      </Modal>

      <Modal
        open={Boolean(deleteModal)}
        title="카테고리 삭제"
        onClose={() => setDeleteModal(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={busy}>
              취소
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={busy}>
              {busy ? '삭제 중…' : '삭제'}
            </Button>
          </>
        }
      >
        {deleteModal?.count ? (
          <p>
            이 카테고리를 사용하는 게시글 또는 해외 링크가{' '}
            <strong>{deleteModal.count}건</strong> 있습니다. 삭제해도 계속할까요?
          </p>
        ) : (
          <p>이 카테고리를 삭제할까요?</p>
        )}
      </Modal>
    </div>
  )
}
