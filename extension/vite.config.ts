import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = import.meta.dirname
const shared = resolve(root, '../src/shared')

export default defineConfig({
  root,
  base: './',
  resolve: {
    alias: { '@shared': shared }
  },
  plugins: [react()],
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        background: resolve(root, 'src/background.ts')
      },
      output: {
        entryFileNames: chunk => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
