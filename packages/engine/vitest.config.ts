import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@lucid-2d/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
