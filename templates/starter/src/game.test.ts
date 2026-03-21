/**
 * Example test using Lucid test utilities
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, tap, assertTree } from '@lucid-2d/engine';
import { MenuScene } from './scenes/menu';

describe('Game flow', () => {
  it('starts at menu with play button', () => {
    const app = createTestApp();
    app.router.push(new MenuScene(app));
    app.tick(16);

    assertTree(app, `
      MenuScene#menu
      Button#play
    `);
  });

  it('tapping play goes to game scene', () => {
    const app = createTestApp();
    app.router.push(new MenuScene(app));
    app.tick(16);

    tap(app, 'play');
    app.tick(16);

    assertTree(app, `
      GameScene#game
        Target#target
    `);
  });

  it('tapping target increases score', () => {
    const app = createTestApp();
    app.router.push(new MenuScene(app));
    app.tick(16);

    tap(app, 'play');
    app.tick(16);

    // Score starts at 0
    const tree1 = app.root.$inspect();
    expect(tree1).toContain('score=0');

    // Tap target
    tap(app, 'target');
    app.tick(16);

    const tree2 = app.root.$inspect();
    expect(tree2).toContain('score=1');
  });

  it('game ends after 10 seconds', () => {
    const app = createTestApp();
    app.router.push(new MenuScene(app));
    app.tick(16);

    tap(app, 'play');
    app.tick(16);

    // Fast-forward 11 seconds
    app.tick(11000);

    assertTree(app, `
      ResultScene#result
      Button#again
      Button#menu
    `);
  });
});
