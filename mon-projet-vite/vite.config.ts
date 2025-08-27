import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,       // accessible depuis l'iPad sur le réseau local
    port: 5173,       // port imposé
    strictPort: true, // si 5173 est occupé => Vite refuse de démarrer (pas d'auto-switch)
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
