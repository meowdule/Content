import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { CategoriesPage } from './pages/CategoriesPage'
import { PostDetailPage } from './pages/PostDetailPage'
import { PostFormPage } from './pages/PostFormPage'
import { PostsPage } from './pages/PostsPage'
import { ReferenceFormPage } from './pages/ReferenceFormPage'
import { ReferencesPage } from './pages/ReferencesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/posts" replace />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/new" element={<PostFormPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<PostFormPage />} />
        <Route path="/references" element={<ReferencesPage />} />
        <Route path="/references/new" element={<ReferenceFormPage />} />
        <Route path="/references/:id/edit" element={<ReferenceFormPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  )
}
