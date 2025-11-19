import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
          'vendor': ['react', 'react-dom', 'zustand', '@google/genai']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
});