import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to https://username.github.io/repository-name/
// use base: '/repository-name/'
// If deploying to https://username.github.io/ (user site)
// use base: '/'

export default defineConfig({
  plugins: [react()],
  base: '/', // Change this based on your GitHub Pages URL
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util',
    },
  }
})
