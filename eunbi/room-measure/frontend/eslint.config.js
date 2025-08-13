import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node, // process 전역변수 허용
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // 미래 사용 예정 변수들과 3D 관련 변수들 허용
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]|^(roomHeight|mouse|height|depth|width|y3D?|x3D?|z3D?)$',
        argsIgnorePattern: '^_|^(error|e|index|event)$'
      }],
      // 전역 변수 허용 (Vite 환경)
      'no-undef': ['error', { typeof: true }],
      // React Hooks 의존성 배열 경고만 표시
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
