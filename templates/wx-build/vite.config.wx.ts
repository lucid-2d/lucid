/**
 * Vite config for WeChat Mini Game build.
 *
 * Usage:
 *   npm run build:wx   (add to package.json: "build:wx": "vite build --config vite.config.wx.ts")
 *
 * Output: wx-build/game.js (single file, no HTML)
 * Open wx-build/ in WeChat DevTools.
 */
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    // Single JS output — WeChat loads game.js as entry
    lib: {
      entry: path.resolve(__dirname, 'src/main-wx.ts'),
      formats: ['es'],
      fileName: () => 'game.js',
    },
    outDir: 'wx-build',
    emptyOutDir: false,  // preserve game.json, project.config.json, img/
    minify: 'terser',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      // Point to installed packages (remove these if using npm packages directly)
      // '@lucid-2d/core': path.resolve(__dirname, '../path/to/lucid/packages/core/src/index.ts'),
      // '@lucid-2d/engine': path.resolve(__dirname, '../path/to/lucid/packages/engine/src/index.ts'),
    },
  },
});
