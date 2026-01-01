import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: true,
  },

  build: {
    // Raise warning threshold — Monaco is intentionally large; the chunk split
    // below ensures it's cached separately rather than blocking the main bundle.
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco Editor is ~5 MB; isolate it so the browser caches it
          // independently from application code that changes more frequently.
          'monaco': ['@monaco-editor/react'],

          // Core React runtime — rarely changes, benefits from long-lived cache.
          'vendor-react': ['react', 'react-dom'],

          // Router — stable dependency, separate cache entry.
          'vendor-router': ['react-router-dom'],

          // Framer Motion animation library — large but stable.
          'vendor-motion': ['framer-motion'],


        },
      },
    },
  },
})

