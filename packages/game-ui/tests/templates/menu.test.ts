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

    const play = scene.findById('play');
    play!.$emit('tap');
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

    const settings = scene.findById('settings');
    settings!.$emit('tap');

    const modal = scene.findById('settings-modal');
    expect(modal).toBeDefined();
  });

  it('creates privacy button', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();

    const privacy = scene.findById('privacy');
    expect(privacy).toBeDefined();
  });

  it('privacy button opens privacy dialog', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig());
    scene.onEnter();

    const privacy = scene.findById('privacy');
    privacy!.$emit('tap');

    const modal = scene.findById('privacy-modal');
    expect(modal).toBeDefined();
  });

  it('creates subtitle when provided', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({ subtitle: 'Ball Frenzy' }));
    scene.onEnter();

    const sub = scene.findById('subtitle');
    expect(sub).toBeDefined();
    expect(sub!.$text).toBe('Ball Frenzy');
  });

  it('creates nav bar icons for optional actions', () => {
    const app = makeApp();
    const scene = createScene(app, makeMenuConfig({
      shop: () => {},
      leaderboard: () => {},
    }));
    scene.onEnter();

    expect(scene.findById('shop')).toBeDefined();
    expect(scene.findById('leaderboard')).toBeDefined();
  });

  it('creates checkin icon that opens dialog', () => {
    const app = makeApp();
    let claimed = false;
    const scene = createScene(app, makeMenuConfig({
      checkin: {
        rewards: [10, 20, 30],
        currentDay: 1,
        claimed: false,
        onClaim: () => { claimed = true; },
      },
    }));
    scene.onEnter();

    const checkinBtn = scene.findById('checkin');
    expect(checkinBtn).toBeDefined();

    checkinBtn!.$emit('tap');
    const modal = scene.findById('checkin-modal');
    expect(modal).toBeDefined();
  });

  it('creates endless button when provided', () => {
    const app = makeApp();
    let endlessCalled = false;
    const scene = createScene(app, makeMenuConfig({
      endless: () => { endlessCalled = true; },
    }));
    scene.onEnter();

    const endless = scene.findById('endless');
    expect(endless).toBeDefined();
    endless!.$emit('tap');
    expect(endlessCalled).toBe(true);
  });
});
