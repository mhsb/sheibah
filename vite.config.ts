import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you're deploying to https://mhsb.github.io/repository-name/
// use base: '/repository-name/'
// If you're deploying to https://mhsb.github.io/ (user site)
// use base: '/'

export default defineConfig({
  plugins: [react()],
  base: '/', // Change this if deploying to project site
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true
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
  },
  optimizeDeps: {
    include: ['buffer', 'stream-browserify', 'util']
  }
})
