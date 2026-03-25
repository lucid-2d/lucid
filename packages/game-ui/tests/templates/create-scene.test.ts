import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { createScene } from '../../src/templates/create-scene';
import { isTemplateScene } from '../../src/templates/template-scene';
import type { TemplateApp, MenuConfig, GameplayConfig, ResultConfig, MapConfig, ShopConfig, ListConfig, PassConfig } from '../../src/templates/types';

// Mock app
function makeApp(): TemplateApp {
  const root = new UINode({ id: 'root', width: 390, height: 844 });
  return {
    screen: { width: 390, height: 844 },
    router: {
      push: () => {},
      replace: () => {},
      pop: () => {},
      current: undefined,
    },
    root,
    tick: () => {},
  };
}

const validSettings = {
  toggles: [{ id: 'bgm', label: '背景音乐', value: true }],
  onToggle: () => {},
};
const validPrivacy = { content: '隐私协议' };

describe('createScene validation', () => {
  describe('MenuTemplate', () => {
    it('requires play', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'menu', title: 'X',
        settings: validSettings, privacy: validPrivacy,
      } as any)).toThrow('play');
    });

    it('requires settings', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'menu', title: 'X',
        play: () => {}, privacy: validPrivacy,
      } as any)).toThrow('settings');
    });

    it('requires privacy', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'menu', title: 'X',
        play: () => {}, settings: validSettings,
      } as any)).toThrow('privacy');
    });

    it('creates valid scene', () => {
      const app = makeApp();
      const scene = createScene(app, {
        template: 'menu', title: 'Test',
        play: () => {},
        settings: validSettings,
        privacy: validPrivacy,
      });
      expect(isTemplateScene(scene)).toBe(true);
      expect(scene.templateType).toBe('menu');
      expect(scene.width).toBe(390);
      expect(scene.height).toBe(844);
    });
  });

  describe('GameplayTemplate', () => {
    it('requires pause with restart and home', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'gameplay',
        setup: () => {},
      } as any)).toThrow('pause');

      expect(() => createScene(app, {
        template: 'gameplay',
        pause: { home: () => {} },
        setup: () => {},
      } as any)).toThrow('restart');

      expect(() => createScene(app, {
        template: 'gameplay',
        pause: { restart: () => {} },
        setup: () => {},
      } as any)).toThrow('home');
    });

    it('requires setup', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'gameplay',
        pause: { restart: () => {}, home: () => {} },
      } as any)).toThrow('setup');
    });

    it('creates valid scene', () => {
      const app = makeApp();
      const scene = createScene(app, {
        template: 'gameplay',
        pause: { restart: () => {}, home: () => {} },
        setup: () => {},
      });
      expect(scene.templateType).toBe('gameplay');
    });
  });

  describe('ResultTemplate', () => {
    it('requires restart or home', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'result', title: 'X', score: 100,
      } as any)).toThrow('restart, home');
    });

    it('requires score', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'result', title: 'X', restart: () => {},
      } as any)).toThrow('score');
    });

    it('accepts restart only', () => {
      const app = makeApp();
      const scene = createScene(app, {
        template: 'result', title: 'X', score: 100,
        restart: () => {},
      });
      expect(scene.templateType).toBe('result');
    });

    it('accepts home only', () => {
      const app = makeApp();
      const scene = createScene(app, {
        template: 'result', title: 'X', score: 100,
        home: () => {},
      });
      expect(scene.templateType).toBe('result');
    });
  });

  describe('MapTemplate', () => {
    it('requires back and setup', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'map',
        setup: () => {},
      } as any)).toThrow('back');

      expect(() => createScene(app, {
        template: 'map',
        back: () => {},
      } as any)).toThrow('setup');
    });

    it('creates valid scene', () => {
      const app = makeApp();
      const scene = createScene(app, {
        template: 'map',
        back: () => {},
        setup: () => {},
      });
      expect(scene.templateType).toBe('map');
    });
  });

  describe('ShopTemplate', () => {
    it('requires back', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'shop', variant: 'skin', items: [],
      } as any)).toThrow('back');
    });

    it('skin variant requires items', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'shop', variant: 'skin', back: () => {},
      } as any)).toThrow('items');
    });

    it('coin variant requires coinItems', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'shop', variant: 'coin', back: () => {},
      } as any)).toThrow('coinItems');
    });
  });

  describe('ListTemplate', () => {
    it('requires back and entries', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'list', variant: 'leaderboard', entries: [],
      } as any)).toThrow('back');

      expect(() => createScene(app, {
        template: 'list', variant: 'leaderboard', back: () => {},
      } as any)).toThrow('entries');
    });
  });

  describe('PassTemplate', () => {
    it('requires back and rewards', () => {
      const app = makeApp();
      expect(() => createScene(app, {
        template: 'pass', rewards: [],
        currentLevel: 1, currentXP: 0, xpToNext: 100, isPremium: false,
      } as any)).toThrow('back');

      expect(() => createScene(app, {
        template: 'pass', back: () => {},
        currentLevel: 1, currentXP: 0, xpToNext: 100, isPremium: false,
      } as any)).toThrow('rewards');
    });
  });

  describe('unknown template', () => {
    it('throws for unknown template type', () => {
      const app = makeApp();
      expect(() => createScene(app, { template: 'xyz' } as any)).toThrow('Unknown template');
    });
  });
});

describe('isTemplateScene', () => {
  it('returns true for template scenes', () => {
    const app = makeApp();
    const scene = createScene(app, {
      template: 'menu', title: 'X',
      play: () => {}, settings: validSettings, privacy: validPrivacy,
    });
    expect(isTemplateScene(scene)).toBe(true);
  });

  it('returns false for plain UINode', () => {
    expect(isTemplateScene(new UINode({ id: 'x', width: 10, height: 10 }))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isTemplateScene(null)).toBe(false);
    expect(isTemplateScene(undefined)).toBe(false);
  });
});

describe('TemplateScene properties', () => {
  it('has correct $text', () => {
    const app = makeApp();
    const scene = createScene(app, {
      template: 'menu', title: 'Test',
      play: () => {}, settings: validSettings, privacy: validPrivacy,
    });
    expect(scene.$text).toContain('menu');
  });

  it('uses screen dimensions', () => {
    const app = makeApp();
    app.screen.width = 414;
    app.screen.height = 896;
    const scene = createScene(app, {
      template: 'result', title: 'X', score: 100, restart: () => {},
    });
    expect(scene.width).toBe(414);
    expect(scene.height).toBe(896);
  });

  it('allows custom id', () => {
    const app = makeApp();
    const scene = createScene(app, {
      template: 'result', id: 'my-result', title: 'X', score: 100, restart: () => {},
    });
    expect(scene.id).toBe('my-result');
  });
});
