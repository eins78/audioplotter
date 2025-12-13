import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests (no browser needed)
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.test.tsx'],
  },
})
