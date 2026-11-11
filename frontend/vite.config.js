import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      port: 5173,
    },
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
  }
})
