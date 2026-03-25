import { describe, it, expect } from 'vitest';
import { ACTION_DEFAULTS, ACTION_SIZES, getActionDef } from '../../src/templates/actions';

describe('ACTION_DEFAULTS', () => {
  it('defines all action codes', () => {
    const codes = Object.keys(ACTION_DEFAULTS);
    expect(codes.length).toBeGreaterThanOrEqual(22);
  });

  it('play has correct defaults', () => {
    const play = ACTION_DEFAULTS.play;
    expect(play.icon).toBe('play');
    expect(play.variant).toBe('primary');
    expect(play.size).toBe('lg');
    expect(play.text).toBe('开始游戏');
  });

  it('pause is icon size with no text', () => {
    const pause = ACTION_DEFAULTS.pause;
    expect(pause.size).toBe('icon');
    expect(pause.text).toBe('');
  });

  it('settings is icon-sized ghost', () => {
    const s = ACTION_DEFAULTS.settings;
    expect(s.icon).toBe('settings');
    expect(s.size).toBe('icon');
    expect(s.variant).toBe('ghost');
  });

  it('every action has variant and size', () => {
    for (const [code, def] of Object.entries(ACTION_DEFAULTS)) {
      expect(def.variant, `${code} should have variant`).toBeTruthy();
      expect(def.size, `${code} should have size`).toBeTruthy();
      expect(typeof def.text, `${code} should have text`).toBe('string');
    }
  });
});

describe('ACTION_SIZES', () => {
  it('all sizes have width >= 44 and height >= 36', () => {
    for (const [size, dim] of Object.entries(ACTION_SIZES)) {
      expect(dim.width, `${size} width`).toBeGreaterThanOrEqual(44);
      expect(dim.height, `${size} height`).toBeGreaterThanOrEqual(36);
    }
  });

  it('lg is larger than md', () => {
    expect(ACTION_SIZES.lg.width).toBeGreaterThan(ACTION_SIZES.md.width);
    expect(ACTION_SIZES.lg.height).toBeGreaterThanOrEqual(ACTION_SIZES.md.height);
  });
});

describe('getActionDef', () => {
  it('returns the correct definition', () => {
    expect(getActionDef('play')).toBe(ACTION_DEFAULTS.play);
    expect(getActionDef('home')).toBe(ACTION_DEFAULTS.home);
  });
});
