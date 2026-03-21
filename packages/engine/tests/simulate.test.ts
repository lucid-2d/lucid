import { describe, it, expect } from 'vitest';
import { batchSimulate } from '../src/simulate';
import { createTestApp } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

// Simple game: score increases each tick
class ScoreScene extends SceneNode {
  score = 0;
  seed: number;
  constructor(seed: number) {
    super({ id: 'game', width: 390, height: 844 });
    this.seed = seed;
  }
  onEnter() {
    const label = new UINode({ id: 'score', width: 100, height: 30 });
    this.addChild(label);
  }
  $update(dt: number) {
    super.$update(dt);
    this.score += Math.round(this.seed * dt * 100);
  }
  protected $inspectInfo() { return `score=${this.score}`; }
}

describe('batchSimulate', () => {
  it('runs multiple simulations and collects metrics', () => {
    const result = batchSimulate({
      count: 5,
      setup: (i) => {
        const app = createTestApp();
        app.router.push(new ScoreScene(i + 1));
        return app;
      },
      run: (app) => {
        for (let t = 0; t < 60; t++) app.tick(16);
      },
      evaluate: (app) => {
        const scene = app.root.$query('ScoreScene')[0] as ScoreScene;
        return { score: scene.score };
      },
    });

    expect(result.results).toHaveLength(5);
    expect(result.totalDuration).toBeGreaterThan(0);

    // Higher seed = higher score
    const scores = result.results.map(r => r.metrics.score);
    expect(scores[4]).toBeGreaterThan(scores[0]);
  });

  it('computes summary stats', () => {
    const result = batchSimulate({
      count: 3,
      setup: (i) => {
        const app = createTestApp();
        app.router.push(new ScoreScene(i + 1));
        return app;
      },
      run: (app) => { app.tick(100); },
      evaluate: () => ({ value: 10, label: 'test' }),
    });

    expect(result.summary.value).toBeDefined();
    expect(result.summary.value.min).toBe(10);
    expect(result.summary.value.avg).toBe(10);
    // 'label' is string, should not appear in summary
    expect(result.summary.label).toBeUndefined();
  });

  it('captures $inspect tree', () => {
    const result = batchSimulate({
      count: 1,
      setup: () => {
        const app = createTestApp();
        app.router.push(new ScoreScene(1));
        return app;
      },
      run: (app) => { app.tick(16); },
      evaluate: () => ({ ok: 1 }),
    });

    expect(result.results[0].tree).toContain('ScoreScene#game');
  });

  it('screenshots when requested', () => {
    const result = batchSimulate({
      count: 3,
      screenshot: (i) => i === 1, // only screenshot index 1
      setup: () => {
        const app = createTestApp({ render: true });
        app.router.push(new ScoreScene(1));
        return app;
      },
      run: (app) => { app.tick(16); },
      evaluate: () => ({ x: 1 }),
    });

    expect(result.results[0].image).toBeUndefined();
    expect(result.results[1].image).toBeInstanceOf(Buffer);
    expect(result.results[2].image).toBeUndefined();
  });

  it('finds best variant by metric', () => {
    const result = batchSimulate({
      count: 10,
      setup: (i) => {
        const app = createTestApp();
        app.router.push(new ScoreScene(i + 1));
        return app;
      },
      run: (app) => {
        for (let t = 0; t < 30; t++) app.tick(16);
      },
      evaluate: (app) => {
        const scene = app.root.$query('ScoreScene')[0] as ScoreScene;
        return { score: scene.score, seed: scene.seed };
      },
    });

    const best = result.results.sort((a, b) => b.metrics.score - a.metrics.score)[0];
    expect(best.metrics.seed).toBe(10); // highest seed = highest score
    expect(result.summary.score.max).toBe(best.metrics.score);
  });
});
