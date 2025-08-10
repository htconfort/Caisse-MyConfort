import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use current working directory as root for env loading
  const root = process.cwd()
  const env = loadEnv(mode, root, '')
  const isDev = mode === 'development'

  const n8nEnabled = env.VITE_N8N_ENABLED === 'true'
  const n8nTarget = env.VITE_N8N_TARGET || 'http://localhost:5678'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV)
    },
    server: {
      port: 5173,
      host: true,
      open: true,
      proxy: n8nEnabled && isDev
        ? {
            '/api/n8n': {
              target: n8nTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
              secure: false
            }
          }
        : undefined
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})
