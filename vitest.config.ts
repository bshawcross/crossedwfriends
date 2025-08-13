import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    include: [
      'tests/**/*.test.ts',
      '__tests__/**/*.test.ts',
    ],
    environment: 'jsdom',
  },
});
