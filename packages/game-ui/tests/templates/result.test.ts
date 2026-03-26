import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { createScene } from '../../src/templates/create-scene';
import type { TemplateApp, ResultConfig } from '../../src/templates/types';

function makeApp(): TemplateApp {
  const root = new UINode({ id: 'root', width: 390, height: 844 });
  return {
    screen: { width: 390, height: 844 },
    router: { push: () => {}, replace: () => {}, pop: () => {}, current: undefined },
    root,
    tick: () => {},
  };
}

function makeResultConfig(overrides: Partial<ResultConfig> = {}): ResultConfig {
  return {
    template: 'result',
    title: 'Game Over',
    score: 12345,
    restart: () => {},
    home: () => {},
    ...overrides,
  };
}

describe('ResultTemplate', () => {
  it('creates title and score', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig());
    scene.onEnter();

    const title = scene.findById('result-title');
    expect(title).toBeDefined();
    expect(title!.$text).toBe('Game Over');

    const score = scene.findById('score');
    expect(score).toBeDefined();
    expect(score!.$text).toBe('12345');
  });

  it('shows NEW BEST when isNewBest', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig({ isNewBest: true }));
    scene.onEnter();

    const best = scene.findById('new-best');
    expect(best).toBeDefined();
    expect(best!.$text).toBe('NEW BEST!');
  });

  it('does not show NEW BEST by default', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig());
    scene.onEnter();

    expect(scene.findById('new-best')).toBeNull();
  });

  it('creates restart button', () => {
    const app = makeApp();
    let restarted = false;
    const scene = createScene(app, makeResultConfig({
      restart: () => { restarted = true; },
    }));
    scene.onEnter();

    const btn = scene.findById('restart');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(restarted).toBe(true);
  });

  it('creates home button', () => {
    const app = makeApp();
    let wentHome = false;
    const scene = createScene(app, makeResultConfig({
      home: () => { wentHome = true; },
    }));
    scene.onEnter();

    const btn = scene.findById('home');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(wentHome).toBe(true);
  });

  it('creates share button', () => {
    const app = makeApp();
    let shared = false;
    const scene = createScene(app, makeResultConfig({
      share: () => { shared = true; },
    }));
    scene.onEnter();

    const btn = scene.findById('share');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(shared).toBe(true);
  });

  it('creates ad button with custom text', () => {
    const app = makeApp();
    let adShown = false;
    const scene = createScene(app, makeResultConfig({
      ad: { text: '看广告 双倍金币', onTap: () => { adShown = true; } },
    }));
    scene.onEnter();

    const btn = scene.findById('ad');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(adShown).toBe(true);
  });

  it('creates stats cards', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig({
      stats: [
        { icon: 'coin', label: '金币', value: '+128' },
        { icon: 'medal', label: '关卡', value: '15' },
      ],
    }));
    scene.onEnter();

    expect(scene.findById('stat-0')).toBeDefined();
    expect(scene.findById('stat-1')).toBeDefined();
  });

  it('works with only restart (no home)', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig({ home: undefined }));
    scene.onEnter();

    expect(scene.findById('restart')).toBeDefined();
    expect(scene.findById('home')).toBeNull();
  });

  it('works with only home (no restart)', () => {
    const app = makeApp();
    const scene = createScene(app, makeResultConfig({ restart: undefined }));
    scene.onEnter();

    expect(scene.findById('home')).toBeDefined();
    expect(scene.findById('restart')).toBeNull();
  });

  // ── v0.6.0 additions ──

  describe('rankChange', () => {
    it('shows rank improvement with up arrow', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        rankChange: { from: 8, to: 3 },
      }));
      scene.onEnter();

      const label = scene.findById('rank-change');
      expect(label).toBeDefined();
      expect(label!.$text).toBe('排名 #8 → #3 ↑');
    });

    it('shows rank decline with down arrow', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        rankChange: { from: 3, to: 7 },
      }));
      scene.onEnter();

      const label = scene.findById('rank-change');
      expect(label).toBeDefined();
      expect(label!.$text).toBe('排名 #3 → #7 ↓');
    });

    it('shows no arrow when rank unchanged', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        rankChange: { from: 5, to: 5 },
      }));
      scene.onEnter();

      const label = scene.findById('rank-change');
      expect(label!.$text).toBe('排名 #5 → #5 ');
    });

    it('not shown when not provided', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig());
      scene.onEnter();

      expect(scene.findById('rank-change')).toBeNull();
    });
  });

  describe('doubleReward', () => {
    it('creates double-reward button', () => {
      const app = makeApp();
      let tapped = false;
      const scene = createScene(app, makeResultConfig({
        doubleReward: { onTap: () => { tapped = true; } },
      }));
      scene.onEnter();

      const btn = scene.findById('double-reward');
      expect(btn).toBeDefined();
      expect(btn!.$text).toBe('双倍奖励');
      btn!.$emit('tap');
      expect(tapped).toBe(true);
    });

    it('uses custom text', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        doubleReward: { text: '看广告双倍金币', onTap: () => {} },
      }));
      scene.onEnter();

      const btn = scene.findById('double-reward');
      expect(btn!.$text).toBe('看广告双倍金币');
    });
  });

  describe('countdown', () => {
    it('shows countdown on revive button', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        revive: { onTap: () => {} },
        countdown: 5,
      }));
      scene.onEnter();

      const btn = scene.findById('revive');
      expect(btn!.$text).toBe('复活 (5s)');
    });

    it('updates countdown text each second', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        revive: { onTap: () => {} },
        countdown: 3,
      }));
      scene.onEnter();

      // Simulate 1 second (dt in seconds, matching engine behavior)
      scene.$update(1);
      const btn = scene.findById('revive');
      expect(btn!.$text).toBe('复活 (2s)');

      // Simulate another second
      scene.$update(1);
      expect(btn!.$text).toBe('复活 (1s)');
    });

    it('hides revive button when countdown expires', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        revive: { onTap: () => {} },
        countdown: 2,
      }));
      scene.onEnter();

      const btn = scene.findById('revive');
      expect(btn!.visible).toBe(true);

      // Simulate 2 seconds
      scene.$update(2);
      expect(btn!.visible).toBe(false);
    });

    it('emits countdown-expired event', () => {
      const app = makeApp();
      let expired = false;
      const scene = createScene(app, makeResultConfig({
        revive: { onTap: () => {} },
        countdown: 1,
      }));
      scene.onEnter();
      scene.$on('countdown-expired', () => { expired = true; });

      scene.$update(1);
      expect(expired).toBe(true);
    });

    it('is ignored without revive', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        countdown: 5,
      }));
      scene.onEnter();

      // Should not crash, revive button not created
      expect(scene.findById('revive')).toBeNull();
    });

    it('works with custom revive text', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        revive: { text: '看广告继续', onTap: () => {} },
        countdown: 5,
      }));
      scene.onEnter();

      const btn = scene.findById('revive');
      expect(btn!.$text).toBe('看广告继续 (5s)');
    });
  });

  describe('combined features', () => {
    it('renders all v0.6.0 features together', () => {
      const app = makeApp();
      const scene = createScene(app, makeResultConfig({
        isNewBest: true,
        rankChange: { from: 10, to: 5 },
        revive: { onTap: () => {} },
        countdown: 5,
        doubleReward: { onTap: () => {} },
        ad: { onTap: () => {} },
        share: () => {},
        stats: [
          { icon: 'coin', label: '金币', value: '+500' },
          { icon: 'star', label: '经验', value: '+120' },
        ],
      }));
      scene.onEnter();

      // All elements present
      expect(scene.findById('new-best')).toBeDefined();
      expect(scene.findById('rank-change')).toBeDefined();
      expect(scene.findById('revive')).toBeDefined();
      expect(scene.findById('double-reward')).toBeDefined();
      expect(scene.findById('ad')).toBeDefined();
      expect(scene.findById('restart')).toBeDefined();
      expect(scene.findById('home')).toBeDefined();
      expect(scene.findById('share')).toBeDefined();
      expect(scene.findById('stat-0')).toBeDefined();
      expect(scene.findById('stat-1')).toBeDefined();
    });
  });
});
