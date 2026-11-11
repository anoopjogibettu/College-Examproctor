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
           */
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom/')) {
              return 'vendor-router'
            }
            if (id.includes('node_modules/socket.io-client/')) {
              return 'vendor-socket'
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons'
            }
          },
        },
      },
    },
  }
})
