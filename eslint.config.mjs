import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

// Flat config 包裝 eslint-config-next (legacy 格式) + 自訂規則
// - 'next/core-web-vitals' 含 React / Hooks / a11y / Import / Next.js recommended rules
// - 自訂 rules block 顯式 import @typescript-eslint plugin,讓 flat config 能解析規則前綴

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  { ignores: ['node_modules/**', '.next/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: { parser: tsParser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-undef': 'off',
    },
  },
]

export default config