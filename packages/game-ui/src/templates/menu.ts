/**
 * MenuTemplate — main menu scene.
 *
 * Required: play, settings, privacy
 * Optional: checkin, lucky-box, shop, leaderboard, battlepass, endless
 */

import { UINode } from '@lucid-2d/core';
import { Button, IconButton, Label, UIColors } from '@lucid-2d/ui';
import { SettingsPanel } from '../settings-panel.js';
import { PrivacyDialog } from '../privacy-dialog.js';
import { CheckinDialog } from '../checkin-dialog.js';
import { LuckyBoxDialog } from '../lucky-box-dialog.js';
import { ACTION_DEFAULTS, ACTION_SIZES } from './actions.js';
import type { MenuConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildMenu(scene: TemplateScene, config: MenuConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Title area (top 30%) ──
  const titleY = Math.round(h * 0.18);
  const title = new Label({
    id: 'title',
    text: config.title,
    fontSize: 36,
    fontWeight: 'bold',
    color: UIColors.text,
    align: 'center',
    width: w,
    height: 50,
  });
  title.y = titleY;
  scene.addChild(title);

  if (config.subtitle) {
    const sub = new Label({
      id: 'subtitle',
      text: config.subtitle,
      fontSize: 16,
      color: UIColors.textSecondary,
      align: 'center',
      width: w,
      height: 24,
    });
    sub.y = titleY + 56;
    scene.addChild(sub);
  }

  // ── Hero content (optional custom area) ──
  if (config.heroContent) {
    const heroContainer = new UINode({ id: '__hero', width: w, height: Math.round(h * 0.2) });
    heroContainer.y = Math.round(h * 0.32);
    scene.addChild(heroContainer);
    config.heroContent(heroContainer);
  }

  // ── Primary action (center) ──
  const playDef = ACTION_DEFAULTS.play;
  const playSize = ACTION_SIZES.lg;
  const playBtn = new Button({
    id: 'play',
    text: playDef.text,
    variant: playDef.variant,
    width: playSize.width,
    height: playSize.height,
  });
  playBtn.x = Math.round((w - playSize.width) / 2);
  playBtn.y = Math.round(h * 0.55);
  playBtn.$on('tap', () => config.play());
  scene.addChild(playBtn);

  // ── Endless mode (optional, below play) ──
  if (config.endless) {
    const endlessBtn = new Button({
      id: 'endless',
      text: '无尽模式',
      variant: 'outline',
      width: playSize.width,
      height: playSize.height,
    });
    endlessBtn.x = Math.round((w - playSize.width) / 2);
    endlessBtn.y = Math.round(h * 0.55) + playSize.height + 16;
    endlessBtn.$on('tap', () => config.endless!());
    scene.addChild(endlessBtn);
  }

  // ── Nav bar (icon buttons, right side or bottom area) ──
  const navActions: Array<{ code: string; handler: () => void }> = [];

  // Settings & Privacy are built-in dialogs, not simple nav
  // We add their trigger icons to the nav bar

  if (config.checkin) {
    navActions.push({ code: 'checkin', handler: () => openCheckin(scene, config, app) });
  }
  if (config.shop) {
    navActions.push({ code: 'shop', handler: config.shop });
  }
  if (config.battlepass) {
    navActions.push({ code: 'battlepass', handler: config.battlepass });
  }
  if (config.leaderboard) {
    navActions.push({ code: 'leaderboard', handler: config.leaderboard });
  }
  if (config['lucky-box']) {
    navActions.push({ code: 'lucky-box', handler: () => openLuckyBox(scene, config, app) });
  }

  // Layout nav icons in a row at bottom area
  if (navActions.length > 0) {
    const iconSize = 44;
    const gap = 16;
    const totalW = navActions.length * iconSize + (navActions.length - 1) * gap;
    let nx = Math.round((w - totalW) / 2);
    const ny = Math.round(h * 0.78);

    for (const action of navActions) {
      const def = ACTION_DEFAULTS[action.code as keyof typeof ACTION_DEFAULTS];
      if (!def?.icon) continue;
      const btn = new IconButton({
        id: action.code,
        icon: def.icon,
        size: iconSize,
      });
      btn.x = nx;
      btn.y = ny;
      btn.$on('tap', action.handler);
      scene.addChild(btn);
      nx += iconSize + gap;
    }
  }

  // ── Settings icon (top-right) ──
  const settingsBtn = new IconButton({
    id: 'settings',
    icon: 'settings',
    size: 44,
  });
  settingsBtn.x = w - 44 - 16;
  settingsBtn.y = 44; // safe area offset
  settingsBtn.$on('tap', () => openSettings(scene, config, app));
  scene.addChild(settingsBtn);

  // ── Privacy link (bottom center) ──
  const privacyBtn = new Button({
    id: 'privacy',
    text: '隐私协议',
    variant: 'ghost',
    width: 120,
    height: 44,
    fontSize: 12,
  });
  privacyBtn.x = Math.round((w - 120) / 2);
  privacyBtn.y = h - 64;
  privacyBtn.$on('tap', () => openPrivacy(scene, config, app));
  scene.addChild(privacyBtn);

  // ── Background draw ──
  if (config.drawBackground) {
    const bg = config.drawBackground;
    const origDraw = scene['draw']?.bind(scene);
    scene['draw'] = function (ctx: CanvasRenderingContext2D) {
      bg(ctx, w, h);
      origDraw?.(ctx);
    };
  }
}

// ── Dialog openers ──

function openSettings(scene: TemplateScene, config: MenuConfig, app: TemplateApp): void {
  // Remove any existing settings panel
  const existing = scene.findById('settings-modal');
  if (existing) { scene.removeChild(existing); return; }

  const panel = new SettingsPanel({
    toggles: config.settings.toggles,
    links: config.settings.links,
    version: config.settings.version,
    screenWidth: scene.width,
    screenHeight: scene.height,
  });
  panel.id = 'settings-modal';
  panel.$on('toggle', (id: string, val: boolean) => config.settings.onToggle(id, val));
  if (config.settings.onLink) {
    panel.$on('link', (id: string) => config.settings.onLink!(id));
  }
  panel.$on('close', () => scene.removeChild(panel));
  scene.addChild(panel);
}

function openPrivacy(scene: TemplateScene, config: MenuConfig, _app: TemplateApp): void {
  const existing = scene.findById('privacy-modal');
  if (existing) { scene.removeChild(existing); return; }

  const dialog = new PrivacyDialog({
    content: config.privacy.content,
    screenWidth: scene.width,
    screenHeight: scene.height,
    showViewButton: !!config.privacy.onViewPolicy,
  });
  dialog.id = 'privacy-modal';
  if (config.privacy.onViewPolicy) {
    dialog.$on('viewPolicy', () => config.privacy.onViewPolicy!());
  }
  dialog.$on('agree', () => scene.removeChild(dialog));
  dialog.$on('close', () => scene.removeChild(dialog));
  scene.addChild(dialog);
}

function openCheckin(scene: TemplateScene, config: MenuConfig, _app: TemplateApp): void {
  if (!config.checkin) return;
  const existing = scene.findById('checkin-modal');
  if (existing) { scene.removeChild(existing); return; }

  const dialog = new CheckinDialog({
    rewards: config.checkin.rewards,
    currentDay: config.checkin.currentDay,
    claimed: config.checkin.claimed,
  });
  dialog.id = 'checkin-modal';
  dialog.$on('claim', () => config.checkin!.onClaim());
  dialog.$on('close', () => scene.removeChild(dialog));
  scene.addChild(dialog);
}

function openLuckyBox(scene: TemplateScene, config: MenuConfig, _app: TemplateApp): void {
  if (!config['lucky-box']) return;
  const existing = scene.findById('lucky-box-modal');
  if (existing) { scene.removeChild(existing); return; }

  const lb = config['lucky-box'];
  const dialog = new LuckyBoxDialog({
    fragments: lb.fragments,
    redeemCost: lb.redeemCost,
    freeOpens: lb.freeOpens,
    adOpens: lb.adOpens,
  });
  dialog.id = 'lucky-box-modal';
  if (lb.onOpen) dialog.$on('open', lb.onOpen);
  if (lb.onOpenByAd) dialog.$on('openByAd', lb.onOpenByAd);
  if (lb.onRedeem) dialog.$on('redeem', lb.onRedeem);
  dialog.$on('close', () => scene.removeChild(dialog));
  scene.addChild(dialog);
}
