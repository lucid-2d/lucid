import { defineConfig } from 'vite';
import path from 'path';

// Point to your local Lucid source for development.
// Replace with actual npm package paths when publishing.
const lucid = path.resolve(__dirname, '../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@lucid/core': path.join(lucid, 'core/src/index.ts'),
      '@lucid/engine': path.join(lucid, 'engine/src/index.ts'),
      '@lucid/ui': path.join(lucid, 'ui/src/index.ts'),
      '@lucid/game-ui': path.join(lucid, 'game-ui/src/index.ts'),
      '@lucid/systems': path.join(lucid, 'systems/src/index.ts'),
      '@lucid/physics': path.join(lucid, 'physics/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
  root: __dirname,
  publicDir: false,
});
