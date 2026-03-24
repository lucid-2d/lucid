import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    // @napi-rs/canvas native binary cold-load can take 5-8s under CPU contention
    // (6 packages running tests in parallel). Default 5s is too tight.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@lucid-2d/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
