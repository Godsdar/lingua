import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = import.meta.dirname

export default defineConfig({
  root,
  base: './',
  resolve: {
    alias: { '@shared': resolve(root, '../src/shared') }
  },
  plugins: [react()],
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true
  }
})
