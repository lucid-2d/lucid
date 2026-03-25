import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { createScene } from '../../src/templates/create-scene';
import type { TemplateApp, GameplayConfig } from '../../src/templates/types';

function makeApp(): TemplateApp {
  const root = new UINode({ id: 'root', width: 390, height: 844 });
  return {
    screen: { width: 390, height: 844 },
    router: { push: () => {}, replace: () => {}, pop: () => {}, current: undefined },
    root,
    tick: () => {},
  };
}

function makeGameplayConfig(overrides: Partial<GameplayConfig> = {}): GameplayConfig {
  return {
    template: 'gameplay',
    pause: { restart: () => {}, home: () => {} },
    setup: () => {},
    ...overrides,
  };
}

describe('GameplayTemplate', () => {
  it('creates game area', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig());
    scene.onEnter();

    const gameArea = scene.findById('__game-area');
    expect(gameArea).toBeDefined();
    expect(gameArea!.width).toBe(390);
    expect(gameArea!.height).toBe(844);
  });

  it('calls setup with game area', () => {
    const app = makeApp();
    let setupArea: UINode | null = null;
    const scene = createScene(app, makeGameplayConfig({
      setup: (area) => { setupArea = area; },
    }));
    scene.onEnter();

    expect(setupArea).toBeDefined();
    expect(setupArea!.id).toBe('__game-area');
  });

  it('creates pause button', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig());
    scene.onEnter();

    const pause = scene.findById('pause');
    expect(pause).toBeDefined();
    expect(pause!.interactive).toBe(true);
  });

  it('pause modal exists at build time with required actions', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig());
    scene.onEnter();

    // Modal exists but hidden
    const modal = scene.findById('pause-modal');
    expect(modal).toBeDefined();
    expect(modal!.visible).toBe(false);

    // Required buttons exist inside modal
    expect(scene.findById('resume')).toBeDefined();
    expect(scene.findById('restart')).toBeDefined();
    expect(scene.findById('home')).toBeDefined();

    // Tap pause shows modal
    scene.findById('pause')!.$emit('tap');
    expect(modal!.visible).toBe(true);
  });

  it('resume hides pause modal', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig());
    scene.onEnter();

    scene.findById('pause')!.$emit('tap');
    const modal = scene.findById('pause-modal')!;
    expect(modal.visible).toBe(true);

    scene.findById('resume')!.$emit('tap');
    expect(modal.visible).toBe(false);
  });

  it('restart calls config handler', () => {
    const app = makeApp();
    let restarted = false;
    const scene = createScene(app, makeGameplayConfig({
      pause: { restart: () => { restarted = true; }, home: () => {} },
    }));
    scene.onEnter();

    scene.findById('pause')!.$emit('tap');
    scene.findById('restart')!.$emit('tap');
    expect(restarted).toBe(true);
  });

  it('home calls config handler', () => {
    const app = makeApp();
    let wentHome = false;
    const scene = createScene(app, makeGameplayConfig({
      pause: { restart: () => {}, home: () => { wentHome = true; } },
    }));
    scene.onEnter();

    scene.findById('pause')!.$emit('tap');
    scene.findById('home')!.$emit('tap');
    expect(wentHome).toBe(true);
  });

  it('creates HUD labels when configured', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig({
      hud: {
        score: () => 100,
        level: () => '第3关',
      },
    }));
    scene.onEnter();

    const scoreHud = scene.findById('hud-score');
    expect(scoreHud).toBeDefined();
    expect(scoreHud!.$text).toBe('100');

    const levelHud = scene.findById('hud-level');
    expect(levelHud).toBeDefined();
    expect(levelHud!.$text).toBe('第3关');
  });

  it('pause settings opens settings panel', () => {
    const app = makeApp();
    const scene = createScene(app, makeGameplayConfig({
      pause: {
        restart: () => {},
        home: () => {},
        settings: {
          toggles: [{ id: 'bgm', label: '音乐', value: true }],
          onToggle: () => {},
        },
      },
    }));
    scene.onEnter();

    scene.findById('pause')!.$emit('tap');

    const settingsBtn = scene.findById('pause-settings');
    expect(settingsBtn).toBeDefined();

    settingsBtn!.$emit('tap');
    expect(scene.findById('settings-modal')).toBeDefined();
  });
});
