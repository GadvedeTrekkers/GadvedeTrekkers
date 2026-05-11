import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config for building ONLY the admin panel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'backend/admin-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  base: '/',
});
