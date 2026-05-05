import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

// ビルド後に .nojekyll を自動生成（GitHub Pages の Jekyll 処理をスキップ）
const nojekyll = {
  name: 'nojekyll',
  closeBundle() { writeFileSync('docs/.nojekyll', '') },
}

export default defineConfig({
  plugins: [react(), nojekyll],
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
