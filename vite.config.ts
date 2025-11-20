import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mobile: resolve(__dirname, 'mobile/index.html'),
      },
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
          'vendor': ['react', 'react-dom', 'zustand', '@google/genai', 'react-markdown', 'rehype-katex', 'remark-math']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
});