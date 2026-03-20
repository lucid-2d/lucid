import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
  resolve: {
    alias: {
      '@lucid/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@lucid/ui': path.resolve(__dirname, '../ui/src/index.ts'),
    },
  },
});
