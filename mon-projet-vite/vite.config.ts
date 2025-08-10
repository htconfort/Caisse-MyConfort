import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  define: {
    __PRODUCTION_MODE__: true,
    __DISABLE_DEMO_DATA__: true,
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify('false'),
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api/n8n': {
        target: 'https://n8n.srv765811.hstgr.cloud/webhook',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('🔌 Proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🔗 Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
