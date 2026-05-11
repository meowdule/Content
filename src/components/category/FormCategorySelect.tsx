import type { Category } from '../../types'
import { FormCategoryCascadeSelect } from './CategoryCascadePopover'

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
  return (
    <FormCategoryCascadeSelect
      categories={categories}
      value={value}
      onChange={onChange}
      required={required}
    />
  )
}
