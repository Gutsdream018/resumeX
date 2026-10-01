import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://resumex1.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ['react', 'react-dom'],
          motionVendor: ['framer-motion'],
          threeVendor: ['three', '@react-three/fiber', '@react-three/drei'],
          lucideVendor: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
