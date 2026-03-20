import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@lucid/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@lucid/engine': path.resolve(__dirname, '../packages/engine/src/index.ts'),
      '@lucid/ui': path.resolve(__dirname, '../packages/ui/src/index.ts'),
      '@lucid/game-ui': path.resolve(__dirname, '../packages/game-ui/src/index.ts'),
      '@lucid/physics': path.resolve(__dirname, '../packages/physics/src/index.ts'),
    },
  },
});
