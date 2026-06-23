import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting strategy — separates large vendor libraries
         * so the browser can cache them independently of app code.
         * Changing App.jsx won't bust the cached React/router bundles.
         */
        manualChunks: {
          // React core — rarely changes
          'vendor-react': ['react', 'react-dom'],
          // Routing library
          'vendor-router': ['react-router-dom'],
          // Real-time communication
          'vendor-socket': ['socket.io-client'],
          // Icon library
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
