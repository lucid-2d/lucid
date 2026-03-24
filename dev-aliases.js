/**
 * Lucid dev aliases — for local development with vite/tsconfig
 *
 * Usage in vite.config.ts:
 * ```typescript
 * import { lucidAliases } from '../path/to/lucid/dev-aliases.js';
 *
 * export default defineConfig({
 *   resolve: { alias: lucidAliases() },
 * });
 * ```
 *
 * Or copy the output into your tsconfig.json paths.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate vite/rollup alias entries for all Lucid packages + subpath exports.
 * Returns array format (not object) — subpath exports listed first to avoid
 * Vite's prefix matching eating them (e.g. @lucid-2d/engine before @lucid-2d/engine/testing).
 *
 * @param basePath — path to lucid repo root (defaults to this file's directory)
 */
export function lucidAliases(basePath) {
  const base = basePath || __dirname;
  const pkg = (name, entry = 'index') => path.join(base, 'packages', name, 'src', `${entry}.ts`);

  // Subpath exports MUST come before their parent package
  return [
    { find: '@lucid-2d/engine/testing', replacement: pkg('engine', 'testing') },
    { find: '@lucid-2d/core',           replacement: pkg('core') },
    { find: '@lucid-2d/engine',         replacement: pkg('engine') },
    { find: '@lucid-2d/ui',             replacement: pkg('ui') },
    { find: '@lucid-2d/physics',        replacement: pkg('physics') },
    { find: '@lucid-2d/game-ui',        replacement: pkg('game-ui') },
    { find: '@lucid-2d/systems',        replacement: pkg('systems') },
  ];
}
