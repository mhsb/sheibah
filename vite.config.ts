import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Change this to '/your-repo-name/' if using project site
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets', // This organizes CSS in assets folder
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
