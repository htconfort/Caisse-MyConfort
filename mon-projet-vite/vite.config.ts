import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const enableSourceMap = !!process.env.VITE_SOURCEMAP;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // ⚡ Optimisations de performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: ['@vite/client', '@vite/env']
  },

  // 🚀 Serveur optimisé pour réseau
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Optimisations HMR
    hmr: {
      overlay: true
    },
    // Cache optimisé
    fs: {
      strict: false
    }
  },

  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: enableSourceMap,
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000, // evite faux positifs avec libs PDF
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['jspdf', 'html2canvas'],
          // ajoute ici d'autres gros paquets si besoin (dexie, etc.)
          // db: ['dexie'],
        },
      },
    },
  },

  esbuild: {
    // En prod, on peut retirer console/debugger (désactive si tu veux garder les logs)
    drop: isProd ? ['console', 'debugger'] : [],
  },
});
