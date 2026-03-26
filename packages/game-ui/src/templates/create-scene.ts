/**
 * createScene() — the single entry point for creating template scenes.
 * Validates config at creation time, returns a sealed TemplateScene.
 */

import type {
  TemplateConfig, TemplateApp,
  MenuConfig, GameplayConfig, ResultConfig,
  MapConfig, ShopConfig, ListConfig, PassConfig,
} from './types.js';
import { TemplateScene } from './template-scene.js';
import { buildMenu } from './menu.js';
import { buildGameplay } from './gameplay.js';
import { buildResult } from './result.js';
import { buildMap } from './map.js';
import { buildShop } from './shop.js';
import { buildList } from './list.js';
import { buildPass } from './pass.js';

// ══════════════════════════════════════════
// Config Validators
// ══════════════════════════════════════════

function validateMenu(c: MenuConfig): void {
  if (typeof c.play !== 'function') {
    throw new Error('[lucid] MenuTemplate requires "play" action');
  }
  if (!c.settings || !c.settings.toggles) {
    throw new Error('[lucid] MenuTemplate requires "settings" with toggles');
  }
  if (!c.privacy || !c.privacy.content) {
    throw new Error('[lucid] MenuTemplate requires "privacy" with content');
  }
  // Zone limits
  if (c.zoneC && c.zoneC.length > 3) {
    throw new Error('[lucid] MenuTemplate zoneC supports max 3 buttons (play is separate)');
  }
  if (c.zoneD && c.zoneD.length > 4) {
    throw new Error('[lucid] MenuTemplate zoneD supports max 4 items');
  }
  if (c.stats && c.stats.length > 4) {
    throw new Error('[lucid] MenuTemplate stats supports max 4 entries');
  }
  // Auto-connect validation: zone buttons without onTap must match a dialog config
  const dialogKeys = new Set<string>();
  if (c.checkin) dialogKeys.add('checkin');
  if (c['lucky-box']) dialogKeys.add('lucky-box');

  for (const zone of [c.zoneC, c.zoneD]) {
    if (!zone) continue;
    for (const item of zone) {
      if (!item.onTap && !dialogKeys.has(item.id)) {
        throw new Error(
          `[lucid] MenuTemplate: ZoneButton "${item.id}" has no onTap and no matching dialog config. ` +
          `Provide onTap or declare "${item.id}" config.`
        );
      }
    }
  }
}

function validateGameplay(c: GameplayConfig): void {
  if (!c.pause) {
    throw new Error('[lucid] GameplayTemplate requires "pause" config');
  }
  if (typeof c.pause.restart !== 'function') {
    throw new Error('[lucid] GameplayTemplate pause requires "restart" action');
  }
  if (typeof c.pause.home !== 'function') {
    throw new Error('[lucid] GameplayTemplate pause requires "home" action');
  }
  if (typeof c.setup !== 'function') {
    throw new Error('[lucid] GameplayTemplate requires "setup" function');
  }
}

function validateResult(c: ResultConfig): void {
  if (typeof c.restart !== 'function' && typeof c.home !== 'function') {
    throw new Error('[lucid] ResultTemplate requires at least one of: restart, home');
  }
  if (typeof c.score !== 'number') {
    throw new Error('[lucid] ResultTemplate requires "score" (number)');
  }
  if (c.countdown != null && !c.revive) {
    console.warn('[lucid] ResultTemplate: "countdown" has no effect without "revive"');
  }
  if (c.rankChange) {
    if (typeof c.rankChange.from !== 'number' || typeof c.rankChange.to !== 'number') {
      throw new Error('[lucid] ResultTemplate rankChange requires "from" and "to" (numbers)');
    }
  }
}

function validateMap(c: MapConfig): void {
  if (typeof c.back !== 'function') {
    throw new Error('[lucid] MapTemplate requires "back" action');
  }
  if (typeof c.setup !== 'function') {
    throw new Error('[lucid] MapTemplate requires "setup" function');
  }
}

function validateShop(c: ShopConfig): void {
  if (typeof c.back !== 'function') {
    throw new Error('[lucid] ShopTemplate requires "back" action');
  }
  if (c.variant === 'skin' && !c.items) {
    throw new Error('[lucid] ShopTemplate variant="skin" requires "items"');
  }
  if (c.variant === 'coin' && !c.coinItems) {
    throw new Error('[lucid] ShopTemplate variant="coin" requires "coinItems"');
  }
}

function validateList(c: ListConfig): void {
  if (typeof c.back !== 'function') {
    throw new Error('[lucid] ListTemplate requires "back" action');
  }
  if (!Array.isArray(c.entries)) {
    throw new Error('[lucid] ListTemplate requires "entries" array');
  }
}

function validatePass(c: PassConfig): void {
  if (typeof c.back !== 'function') {
    throw new Error('[lucid] PassTemplate requires "back" action');
  }
  if (!Array.isArray(c.rewards)) {
    throw new Error('[lucid] PassTemplate requires "rewards" array');
  }
}

// ══════════════════════════════════════════
// Main entry
// ══════════════════════════════════════════

export function createScene(app: TemplateApp, config: TemplateConfig): TemplateScene {
  const w = app.screen.width;
  const h = app.screen.height;

  switch (config.template) {
    case 'menu': {
      validateMenu(config);
      const scene = new TemplateScene('menu', config, w, h);
      scene.onEnter = () => buildMenu(scene, config, app);
      return scene;
    }
    case 'gameplay': {
      validateGameplay(config);
      const scene = new TemplateScene('gameplay', config, w, h);
      scene.onEnter = () => buildGameplay(scene, config, app);
      return scene;
    }
    case 'result': {
      validateResult(config);
      const scene = new TemplateScene('result', config, w, h);
      scene.onEnter = () => buildResult(scene, config, app);
      return scene;
    }
    case 'map': {
      validateMap(config);
      const scene = new TemplateScene('map', config, w, h);
      scene.onEnter = () => buildMap(scene, config, app);
      return scene;
    }
    case 'shop': {
      validateShop(config);
      const scene = new TemplateScene('shop', config, w, h);
      scene.onEnter = () => buildShop(scene, config, app);
      return scene;
    }
    case 'list': {
      validateList(config);
      const scene = new TemplateScene('list', config, w, h);
      scene.onEnter = () => buildList(scene, config, app);
      return scene;
    }
    case 'pass': {
      validatePass(config);
      const scene = new TemplateScene('pass', config, w, h);
      scene.onEnter = () => buildPass(scene, config, app);
      return scene;
    }
    default:
      throw new Error(`[lucid] Unknown template: ${(config as any).template}`);
  }
}
