import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3002,
    host: true,
    allowedHosts: [
      'ijipmatjip.site',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.ijipmatjip.site'
    ],
    // HMR 완전 비활성화
    hmr: false,
    proxy: {
      '/imgp': {
        target: 'https://img.peterpanz.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/imgp/, ''),
      },
      '/bidanee-api': {
        target: 'https://dev-bidanee.site',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/bidanee-api/, ''),
      },
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          router: ['react-router-dom'],
        }
      }
    }
  },
})