import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    port: 4000,
    host: true // 외부 접근 허용 (메인 웹페이지 통합 시 필요)
  },
  build: {
    // 메인 웹페이지 통합을 위한 빌드 설정
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 3D 라이브러리 분리 (큰 번들 크기)
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          // 라우터 분리
          router: ['react-router-dom'],
        }
      }
    }
  },
  // 환경변수 설정
  define: {
    // process.env 대체를 위한 설정
    'process.env': {},
    // 개발/프로덕션 환경 구분
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})
