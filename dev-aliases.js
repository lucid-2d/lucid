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
 * @param basePath — path to lucid repo root (defaults to this file's directory)
 */
export function lucidAliases(basePath) {
  const base = basePath || __dirname;
  const pkg = (name, entry = 'index') => path.join(base, 'packages', name, 'src', `${entry}.ts`);

  return {
    '@lucid-2d/core':            pkg('core'),
    '@lucid-2d/engine':          pkg('engine'),
    '@lucid-2d/engine/testing':  pkg('engine', 'testing'),
    '@lucid-2d/ui':              pkg('ui'),
    '@lucid-2d/physics':         pkg('physics'),
    '@lucid-2d/game-ui':         pkg('game-ui'),
    '@lucid-2d/systems':         pkg('systems'),
  };
}
