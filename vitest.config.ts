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
      'test/**/*.test.ts',
      'components/**/*.test.tsx',
    ],
    environment: 'jsdom',
  },
});
