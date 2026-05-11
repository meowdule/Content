import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://meowdule.github.io/Content/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Content/' : '/',
  plugins: [react(), tailwindcss()],
}))
