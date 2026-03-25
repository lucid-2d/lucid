import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { createScene } from '../../src/templates/create-scene';
import type { TemplateApp, MenuConfig } from '../../src/templates/types';

function makeApp(): TemplateApp {
  const root = new UINode({ id: 'root', width: 390, height: 844 });
  return {
    screen: { width: 390, height: 844 },
    router: { push: () => {}, replace: () => {}, pop: () => {}, current: undefined },
    root,
    tick: () => {},
  };
}

function makeMenuConfig(overrides: Partial<MenuConfig> = {}): MenuConfig {
  return {
    template: 'menu',
    title: 'Test Game',
    play: () => {},
    settings: {
      toggles: [{ id: 'bgm', label: '背景音乐', value: true }],
      onToggle: () => {},
    },
    privacy: { content: '隐私协议内容' },
    ...overrides,
  };
}

describe('MenuTemplate', () => {
  // ── Basic rendering ──

  it('creates title label', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    const title = scene.findById('title');
    expect(title).toBeDefined();
    expect(title!.$text).toBe('Test Game');
  });

  it('creates play button', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    const play = scene.findById('play');
    expect(play).toBeDefined();
    expect(play!.interactive).toBe(true);
  });

  it('play button triggers handler', () => {
    const app = makeApp();
    let played = false;
    const scene = createScene(app, makeMenuConfig({ play: () => { played = true; } }));
    scene.onEnter();
    scene.findById('play')!.$emit('tap');
    expect(played).toBe(true);
  });

  it('creates settings icon button', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    const settings = scene.findById('settings');
    expect(settings).toBeDefined();
    expect(settings!.interactive).toBe(true);
  });

  it('settings button opens settings modal', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    scene.findById('settings')!.$emit('tap');
    expect(scene.findById('settings-modal')).toBeDefined();
  });

  it('creates privacy button', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    expect(scene.findById('privacy')).toBeDefined();
  });

  it('creates subtitle when provided', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({ subtitle: 'Ball Frenzy' }));
    scene.onEnter();
    const sub = scene.findById('subtitle');
    expect(sub).toBeDefined();
    expect(sub!.$text).toBe('Ball Frenzy');
  });

  // ── Minimal config renders correctly ──

  it('renders with only required fields', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();
    expect(scene.findById('title')).toBeDefined();
    expect(scene.findById('play')).toBeDefined();
    expect(scene.findById('settings')).toBeDefined();
    expect(scene.findById('privacy')).toBeDefined();
  });

  // ── Best Score ──

  it('shows best score when > 0', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({ bestScore: 12345 }));
    scene.onEnter();
    const score = scene.findById('best-score');
    expect(score).toBeDefined();
    expect(score!.$text).toContain('12,345');
  });

  it('hides best score text when <= 0', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({ bestScore: 0 }));
    scene.onEnter();
    const score = scene.findById('best-score');
    expect(score!.$text).toBe('');
  });

  // ── Stats ──

  it('renders stats cards', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      stats: [
        { icon: 'shield', label: '已玩', value: '42' },
        { icon: 'shield', label: '最远', value: '15' },
      ],
    }));
    scene.onEnter();
    expect(scene.findById('stat-0')).toBeDefined();
    expect(scene.findById('stat-1')).toBeDefined();
    expect(scene.findById('stat-0-value')!.$text).toBe('42');
  });

  // ── Zone A ──

  it('renders Zone A badges', () => {
    const app = makeApp();
    let tapped = false;
    const scene = createScene(app, makeMenuConfig({
      zoneA: [
        { id: 'coins', icon: 'coin', text: '128', onTap: () => { tapped = true; } },
      ],
    }));
    scene.onEnter();
    const badge = scene.findById('coins');
    expect(badge).toBeDefined();
    badge!.$emit('tap');
    expect(tapped).toBe(true);
  });

  // ── Continue Game ──

  it('renders continue game button', () => {
    const app = makeApp();
    let continued = false;
    const scene = createScene(app, makeMenuConfig({
      continueGame: { label: '继续游戏 (第15关)', onTap: () => { continued = true; } },
    }));
    scene.onEnter();
    const btn = scene.findById('continue-game');
    expect(btn).toBeDefined();
    expect(btn!.$text).toBe('继续游戏 (第15关)');
    btn!.$emit('tap');
    expect(continued).toBe(true);
  });

  it('renders continue game sublabel', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      continueGame: { label: '继续冒险', sublabel: 'Act II · HP 3/5', onTap: () => {} },
    }));
    scene.onEnter();
    const sub = scene.findById('continue-sublabel');
    expect(sub).toBeDefined();
    expect(sub!.$text).toBe('Act II · HP 3/5');
  });

  // ── Zone C ──

  it('renders Zone C buttons with ACTION_DEFAULTS', () => {
    const app = makeApp();
    let shopOpened = false;
    const scene = createScene(app, makeMenuConfig({
      zoneC: [
        { id: 'shop', onTap: () => { shopOpened = true; } },
        { id: 'leaderboard', onTap: () => {} },
      ],
    }));
    scene.onEnter();

    const shopBtn = scene.findById('shop');
    expect(shopBtn).toBeDefined();
    shopBtn!.$emit('tap');
    expect(shopOpened).toBe(true);

    expect(scene.findById('leaderboard')).toBeDefined();
  });

  it('renders Zone C custom text', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      zoneC: [
        { id: 'daily', text: '每日挑战 03/25', variant: 'secondary', onTap: () => {} },
      ],
    }));
    scene.onEnter();
    const btn = scene.findById('daily');
    expect(btn).toBeDefined();
    expect(btn!.$text).toBe('每日挑战 03/25');
  });

  // ── Toggles ──

  it('renders toggle switches', () => {
    const app = makeApp();
    let soundVal = true;
    const scene = createScene(app, makeMenuConfig({
      toggles: [
        { id: 'sound', icon: 'sound-on', value: true, onChange: (v) => { soundVal = v; } },
      ],
    }));
    scene.onEnter();
    const toggle = scene.findById('toggle-sound');
    expect(toggle).toBeDefined();
  });

  // ── Zone D ──

  it('renders Zone D bottom bar items', () => {
    const app = makeApp();
    let achievementOpened = false;
    const scene = createScene(app, makeMenuConfig({
      zoneD: [
        { id: 'achievements', icon: 'achievement', text: '成就', onTap: () => { achievementOpened = true; } },
        { id: 'battlepass', onTap: () => {} },
      ],
    }));
    scene.onEnter();
    const ach = scene.findById('achievements');
    expect(ach).toBeDefined();
    ach!.$emit('tap');
    expect(achievementOpened).toBe(true);
    expect(scene.findById('battlepass')).toBeDefined();
  });

  // ── Corners ──

  it('renders corner elements', () => {
    const app = makeApp();
    let leftTapped = false;
    let rightTapped = false;
    const scene = createScene(app, makeMenuConfig({
      cornerLeft: { icon: 'fire', onTap: () => { leftTapped = true; } },
      cornerRight: { icon: 'gift', onTap: () => { rightTapped = true; } },
    }));
    scene.onEnter();

    const left = scene.findById('corner-left');
    expect(left).toBeDefined();
    left!.$emit('tap');
    expect(leftTapped).toBe(true);

    const right = scene.findById('corner-right');
    expect(right).toBeDefined();
    right!.$emit('tap');
    expect(rightTapped).toBe(true);
  });

  // ── Footer ──

  it('renders help and restore links', () => {
    const app = makeApp();
    let helpOpened = false;
    let restored = false;
    const scene = createScene(app, makeMenuConfig({
      help: () => { helpOpened = true; },
      restorePurchase: () => { restored = true; },
    }));
    scene.onEnter();

    const helpBtn = scene.findById('help');
    expect(helpBtn).toBeDefined();
    helpBtn!.$emit('tap');
    expect(helpOpened).toBe(true);

    const restoreBtn = scene.findById('restore');
    expect(restoreBtn).toBeDefined();
    restoreBtn!.$emit('tap');
    expect(restored).toBe(true);
  });

  it('renders version string', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({ version: 'v1.0.0' }));
    scene.onEnter();
    const ver = scene.findById('version');
    expect(ver).toBeDefined();
    expect(ver!.$text).toBe('v1.0.0');
  });

  // ── Auto-connect ──

  it('auto-connects checkin button to CheckinDialog', () => {
    const app = makeApp();
    let claimed = false;
    const scene = createScene(app, makeMenuConfig({
      checkin: { rewards: [10, 20, 30], currentDay: 1, claimed: false, onClaim: () => { claimed = true; } },
      zoneD: [
        { id: 'checkin' }, // no onTap → auto-connect
      ],
    }));
    scene.onEnter();

    const checkinBtn = scene.findById('checkin');
    expect(checkinBtn).toBeDefined();
    checkinBtn!.$emit('tap');
    expect(scene.findById('checkin-modal')).toBeDefined();
  });

  it('auto-connects lucky-box button to LuckyBoxDialog', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      'lucky-box': { fragments: 5, redeemCost: 10, freeOpens: 1, adOpens: 3 },
      zoneD: [
        { id: 'lucky-box' }, // auto-connect
      ],
    }));
    scene.onEnter();

    const btn = scene.findById('lucky-box');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(scene.findById('lucky-box-modal')).toBeDefined();
  });

  // ── Dynamic values / refresh ──

  it('refreshes dynamic bestScore', () => {
    const app = makeApp();
    let score = 100;
    const scene = createScene(app, makeMenuConfig({
      bestScore: () => score,
    }));
    scene.onEnter();
    expect(scene.findById('best-score')!.$text).toContain('100');

    score = 999;
    scene.refresh();
    expect(scene.findById('best-score')!.$text).toContain('999');
  });

  it('refreshes dynamic stat values', () => {
    const app = makeApp();
    let games = 10;
    const scene = createScene(app, makeMenuConfig({
      stats: [
        { icon: 'shield', label: '已玩', value: () => `${games}` },
      ],
    }));
    scene.onEnter();
    expect(scene.findById('stat-0-value')!.$text).toBe('10');

    games = 25;
    scene.refresh();
    expect(scene.findById('stat-0-value')!.$text).toBe('25');
  });

  it('refreshes dynamic Zone A badge text', () => {
    const app = makeApp();
    let coins = 100;
    const scene = createScene(app, makeMenuConfig({
      zoneA: [
        { id: 'coins', icon: 'coin', text: () => `${coins}`, onTap: () => {} },
      ],
    }));
    scene.onEnter();
    expect(scene.findById('coins-text')!.$text).toBe('100');

    coins = 250;
    scene.refresh();
    expect(scene.findById('coins-text')!.$text).toBe('250');
  });

  // ── Disabled state ──

  it('disables Zone C button', () => {
    const app = makeApp();
    let tapped = false;
    const scene = createScene(app, makeMenuConfig({
      zoneC: [
        { id: 'daily', text: '每日挑战', onTap: () => { tapped = true; }, disabled: true },
      ],
    }));
    scene.onEnter();

    const btn = scene.findById('daily');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(tapped).toBe(false); // should NOT fire when disabled
  });

  it('disabled Zone D item has reduced opacity', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      zoneD: [
        { id: 'achievements', icon: 'achievement', text: '成就', onTap: () => {}, disabled: true },
      ],
    }));
    scene.onEnter();
    const item = scene.findById('achievements');
    expect(item).toBeDefined();
    expect(item!.alpha).toBe(0.5);
  });

  it('dynamic disabled updates on refresh', () => {
    const app = makeApp();
    let isDisabled = false;
    const scene = createScene(app, makeMenuConfig({
      zoneD: [
        { id: 'achievements', icon: 'achievement', text: '成就', onTap: () => {}, disabled: () => isDisabled },
      ],
    }));
    scene.onEnter();
    expect(scene.findById('achievements')!.alpha).toBe(1);

    isDisabled = true;
    scene.refresh();
    expect(scene.findById('achievements')!.alpha).toBe(0.5);
  });

  // ── Validation errors ──

  it('throws when zoneC has > 3 items', () => {
    const app = makeApp();
    expect(() => createScene(app, makeMenuConfig({
      zoneC: [
        { id: 'a', text: 'A', onTap: () => {} },
        { id: 'b', text: 'B', onTap: () => {} },
        { id: 'c', text: 'C', onTap: () => {} },
        { id: 'd', text: 'D', onTap: () => {} },
      ],
    }))).toThrow('zoneC supports max 3');
  });

  it('throws when zoneD has > 4 items', () => {
    const app = makeApp();
    expect(() => createScene(app, makeMenuConfig({
      zoneD: [
        { id: 'a', text: 'A', onTap: () => {} },
        { id: 'b', text: 'B', onTap: () => {} },
        { id: 'c', text: 'C', onTap: () => {} },
        { id: 'd', text: 'D', onTap: () => {} },
        { id: 'e', text: 'E', onTap: () => {} },
      ],
    }))).toThrow('zoneD supports max 4');
  });

  it('throws when stats has > 4 entries', () => {
    const app = makeApp();
    const stat = { icon: 'shield' as const, label: 'X', value: '0' };
    expect(() => createScene(app, makeMenuConfig({
      stats: [stat, stat, stat, stat, { ...stat, label: 'Y' }],
    }))).toThrow('stats supports max 4');
  });

  it('throws when zone button has no onTap and no matching dialog config', () => {
    const app = makeApp();
    expect(() => createScene(app, makeMenuConfig({
      zoneD: [
        { id: 'unknown-action' }, // no onTap, no matching dialog
      ],
    }))).toThrow('no onTap and no matching dialog config');
  });

  it('does NOT throw when zone button has no onTap but matching dialog config exists', () => {
    const app = makeApp();
    expect(() => createScene(app, makeMenuConfig({
      checkin: { rewards: [10], currentDay: 1, claimed: false, onClaim: () => {} },
      zoneD: [
        { id: 'checkin' }, // no onTap, but checkin config exists
      ],
    }))).not.toThrow();
  });

  // ── onEnter triggers refresh ──

  it('onEnter auto-calls refresh', () => {
    const app = makeApp();
    let score = 50;
    const scene = createScene(app, makeMenuConfig({ bestScore: () => score }));
    score = 200;
    scene.onEnter(); // should call refresh internally
    expect(scene.findById('best-score')!.$text).toContain('200');
  });
});
