import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base: "./"' is critical for relative paths (GitHub Pages or Native)
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        'service-worker': 'service-worker.js'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'service-worker' ? '[name].js' : 'assets/[name]-[hash].js';
        }
      }
    }
  },
  server: {
    port: 3000
  }
});