/**
 * Batch simulation — run multiple game variants headlessly and collect metrics.
 *
 * Core tool for AI-driven level design: generate → simulate → evaluate → iterate.
 *
 * ```typescript
 * const results = await batchSimulate({
 *   count: 50,
 *   setup: (i) => {
 *     const app = createTestApp({ render: true });
 *     const level = generateLevel(baseSeed + i);
 *     app.router.push(new PlayScene(app, level, new AutoPlayer()));
 *     return app;
 *   },
 *   run: (app) => {
 *     // Fast-forward 30 seconds of gameplay
 *     for (let t = 0; t < 1800; t++) app.tick(16);
 *   },
 *   evaluate: (app, i) => ({
 *     score: parseInt(app.root.findById('score')?.$text ?? '0'),
 *     collected: app.root.$query('#collected').length,
 *     tree: app.root.$inspect(),
 *   }),
 * });
 *
 * // Find best level
 * const best = results.sort((a, b) => b.metrics.score - a.metrics.score)[0];
 * ```
 */

import { type App } from './app.js';
import { createTestApp, type TestApp, type TestAppOptions } from './test-utils.js';

export interface SimulationConfig<T = any> {
  /** Number of simulations to run */
  count: number;
  /** Create and configure an app for simulation i */
  setup: (index: number) => TestApp;
  /** Run the simulation (advance time, trigger actions, etc.) */
  run: (app: TestApp, index: number) => void;
  /** Extract metrics from the finished simulation */
  evaluate: (app: TestApp, index: number) => T;
  /** Save screenshot for this simulation? (default: false) */
  screenshot?: boolean | ((index: number, metrics: T) => boolean);
}

export interface SimulationResult<T = any> {
  /** Simulation index */
  index: number;
  /** Extracted metrics */
  metrics: T;
  /** Final $inspect tree */
  tree: string;
  /** Screenshot PNG buffer (if requested) */
  image?: Buffer;
  /** Duration in ms */
  duration: number;
}

export interface BatchResult<T = any> {
  /** All individual results */
  results: SimulationResult<T>[];
  /** Total time in ms */
  totalDuration: number;
  /** Summary stats (if metrics are numeric) */
  summary: Record<string, { min: number; max: number; avg: number }>;
}

/**
 * Run multiple game simulations and collect metrics.
 *
 * This is the core primitive for AI-driven level design:
 * 1. AI generates level variants (different seeds, layouts, item placements)
 * 2. batchSimulate runs each variant headlessly
 * 3. AI analyzes metrics to find the best design
 * 4. AI iterates based on results
 */
export function batchSimulate<T extends Record<string, any>>(
  config: SimulationConfig<T>,
): BatchResult<T> {
  const startTime = Date.now();
  const results: SimulationResult<T>[] = [];

  for (let i = 0; i < config.count; i++) {
    const simStart = Date.now();

    const app = config.setup(i);
    config.run(app, i);

    const metrics = config.evaluate(app, i);
    const tree = app.root.$inspect();

    let image: Buffer | undefined;
    const shouldScreenshot = typeof config.screenshot === 'function'
      ? config.screenshot(i, metrics)
      : config.screenshot;
    if (shouldScreenshot) {
      try { image = app.toImage(); } catch {}
    }

    results.push({
      index: i,
      metrics,
      tree,
      image,
      duration: Date.now() - simStart,
    });
  }

  // Compute summary stats for numeric metrics
  const summary: Record<string, { min: number; max: number; avg: number }> = {};
  if (results.length > 0) {
    const keys = Object.keys(results[0].metrics);
    for (const key of keys) {
      const values = results.map(r => r.metrics[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        summary[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }
    }
  }

  return {
    results,
    totalDuration: Date.now() - startTime,
    summary,
  };
}
