import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
      'test/**/*.test.ts',
      'components/**/*.test.tsx',
    ],
    environment: 'jsdom',
  },
});
