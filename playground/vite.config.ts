import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  optimizeDeps: {
    exclude: ['@napi-rs/canvas'],
  },
  resolve: {
    alias: {
      '@lucid-2d/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@lucid-2d/engine': path.resolve(__dirname, '../packages/engine/src/index.ts'),
      '@lucid-2d/ui': path.resolve(__dirname, '../packages/ui/src/index.ts'),
      '@lucid-2d/game-ui': path.resolve(__dirname, '../packages/game-ui/src/index.ts'),
      '@lucid-2d/physics': path.resolve(__dirname, '../packages/physics/src/index.ts'),
    },
  },
});
