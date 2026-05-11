export interface Category {
  id: string
  name: string
  parent_id: string | null
  order_num: number
  created_at: string
}

export interface Reference {
  id: string
  title: string
  link: string
  category_id: string | null
  written_at: string | null
  summary: string | null
  is_active: boolean
  created_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  category_id: string | null
  summary: string | null
  reference_links: string[]
  publish_location: string | null
  related_reference_ids: string[]
  is_active: boolean
  created_at: string
}
