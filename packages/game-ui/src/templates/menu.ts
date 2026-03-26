/**
 * MenuTemplate — Zone A/C/D layout model.
 *
 * Required: play, settings, privacy
 * Optional: zoneA, zoneC, zoneD, toggles, corners, stats, bestScore, continueGame, etc.
 */

import { UINode } from '@lucid-2d/core';
import { Button, IconButton, Label, Toggle, UIColors, Icon } from '@lucid-2d/ui';
import { SettingsPanel } from '../settings-panel.js';
import { PrivacyPage } from '../privacy-dialog.js';
import { CheckinDialog } from '../checkin-dialog.js';
import { LuckyBoxDialog } from '../lucky-box-dialog.js';
import { ACTION_DEFAULTS, ACTION_SIZES } from './actions.js';
import type {
  MenuConfig, TemplateApp, ActionCode,
  ZoneBadge, ZoneButton, CornerItem, ToggleItem,
} from './types.js';
import type { TemplateScene } from './template-scene.js';

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════

function resolveText(v: string | (() => string) | undefined): string {
  if (typeof v === 'function') return v();
  return v ?? '';
}

function resolveBadge(v: number | boolean | (() => number | boolean) | undefined): number | boolean | undefined {
  if (typeof v === 'function') return v();
  return v;
}

function resolveDisabled(v: boolean | (() => boolean) | undefined): boolean {
  if (typeof v === 'function') return v();
  return v ?? false;
}

function isActionCode(id: string): id is ActionCode {
  return id in ACTION_DEFAULTS;
}

// ══════════════════════════════════════════
// Build Menu
// ══════════════════════════════════════════

export function buildMenu(scene: TemplateScene, config: MenuConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;
  const safeTop = app.screen.safeTop ?? 44;
  const safeBottom = app.screen.safeBottom ?? 0;

  // Track dynamic updaters for refresh()
  const updaters: Array<() => void> = [];

  // ── Settings icon (top-LEFT — right side blocked by platform capsule button) ──
  const settingsBtn = new IconButton({
    id: 'settings',
    icon: 'settings',
    size: 44,
  });
  settingsBtn.x = 12;
  settingsBtn.y = safeTop;
  settingsBtn.$on('tap', () => openSettings(scene, config, app));
  scene.addChild(settingsBtn);

  // ── Zone A — Top Status Badges (left side, after settings) ──
  if (config.zoneA && config.zoneA.length > 0) {
    let ax = 12 + 44 + 8; // right of settings icon
    const ay = safeTop + 6;

    for (const badge of config.zoneA) {
      const textVal = resolveText(badge.text);
      const badgeText = badge.icon ? `  ${textVal}` : textVal;
      const badgeBtn = new Button({
        id: badge.id,
        text: badgeText,
        variant: 'ghost',
        width: 80,
        height: 32,
        fontSize: 12,
      });
      badgeBtn.x = ax;
      badgeBtn.y = ay;
      badgeBtn.$on('tap', () => badge.onTap());
      scene.addChild(badgeBtn);

      if (typeof badge.text === 'function') {
        const getter = badge.text;
        updaters.push(() => { badgeBtn.text = badge.icon ? `  ${getter()}` : getter(); });
      }

      ax += 88;
    }
  }

  // ── Layout calculation ──
  // Calculate vertical positions based on active zones
  let curY = safeTop + 56;

  // ── Title ──
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
  title.y = curY;
  scene.addChild(title);
  curY += 50;

  // ── Subtitle ──
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
    sub.y = curY + 4;
    scene.addChild(sub);
    curY += 28;
  }

  // ── Best Score ──
  if (config.bestScore !== undefined) {
    const scoreVal = typeof config.bestScore === 'function' ? config.bestScore() : config.bestScore;
    const scoreLabel = new Label({
      id: 'best-score',
      text: scoreVal > 0 ? `最高分: ${scoreVal.toLocaleString()}` : '',
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffd700',
      align: 'center',
      width: w,
      height: 24,
    });
    scoreLabel.y = curY + 8;
    scene.addChild(scoreLabel);

    if (typeof config.bestScore === 'function') {
      const getter = config.bestScore;
      updaters.push(() => {
        const v = getter();
        scoreLabel.text = v > 0 ? `最高分: ${v.toLocaleString()}` : '';
      });
    }

    curY += 36;
  }

  // ── Stats 2×2 grid ──
  if (config.stats && config.stats.length > 0) {
    const cardW = 68;
    const cardH = 60;
    const gap = 8;
    const cols = Math.min(config.stats.length, 4);
    const totalW = cols * cardW + (cols - 1) * gap;
    const startX = Math.round((w - totalW) / 2);
    const statsY = curY + 8;

    for (let i = 0; i < cols; i++) {
      const stat = config.stats[i];
      const card = new UINode({ id: `stat-${i}`, width: cardW, height: cardH });
      card.x = startX + i * (cardW + gap);
      card.y = statsY;

      // Icon
      const iconNode = new Icon({
        id: `stat-${i}-icon`,
        name: stat.icon,
        size: 14,
        color: UIColors.textSecondary,
      });
      iconNode.x = Math.round((cardW - 14) / 2);
      iconNode.y = 2;
      card.addChild(iconNode);

      const valText = typeof stat.value === 'function' ? stat.value() : stat.value;
      const valLabel = new Label({
        id: `stat-${i}-value`,
        text: valText,
        fontSize: 18,
        fontWeight: 'bold',
        color: UIColors.text,
        align: 'center',
        width: cardW,
        height: 22,
      });
      valLabel.y = 18;
      card.addChild(valLabel);

      const nameLabel = new Label({
        id: `stat-${i}-label`,
        text: stat.label,
        fontSize: 10,
        color: UIColors.textSecondary,
        align: 'center',
        width: cardW,
        height: 14,
      });
      nameLabel.y = 42;
      card.addChild(nameLabel);

      if (typeof stat.value === 'function') {
        const getter = stat.value;
        updaters.push(() => { valLabel.text = getter(); });
      }

      scene.addChild(card);
    }

    curY = statsY + cardH + 8;
  }

  // ── Hero content (optional custom area) ──
  if (config.heroContent) {
    // Give heroContent remaining space between stats and buttons
    const heroH = Math.round(h * 0.15);
    const heroContainer = new UINode({ id: '__hero', width: w, height: heroH });
    heroContainer.y = curY;
    scene.addChild(heroContainer);
    config.heroContent(heroContainer);
    curY += heroH;
  }

  // ── Continue Game button ──
  if (config.continueGame) {
    const btnW = 220;
    const btnH = 48;
    const contBtn = new Button({
      id: 'continue-game',
      text: config.continueGame.label,
      variant: 'primary',
      width: btnW,
      height: btnH,
    });
    contBtn.x = Math.round((w - btnW) / 2);
    contBtn.y = curY + 8;
    contBtn.$on('tap', () => config.continueGame!.onTap());
    scene.addChild(contBtn);

    if (config.continueGame.sublabel) {
      const subLabel = new Label({
        id: 'continue-sublabel',
        text: config.continueGame.sublabel,
        fontSize: 11,
        color: UIColors.textSecondary,
        align: 'center',
        width: w,
        height: 16,
      });
      subLabel.y = curY + 8 + btnH + 2;
      scene.addChild(subLabel);
      curY += btnH + 24;
    } else {
      curY += btnH + 16;
    }
  }

  // ── Play button (always present) ──
  // When continueGame exists, play is demoted to secondary (only one primary)
  const playSize = ACTION_SIZES.lg;
  const playVariant = config.continueGame ? 'secondary' : 'primary';
  const playBtn = new Button({
    id: 'play',
    text: ACTION_DEFAULTS.play.text,
    variant: playVariant,
    width: playSize.width,
    height: playSize.height,
  });
  playBtn.x = Math.round((w - playSize.width) / 2);
  // Center play in the middle area
  const playY = Math.max(curY + 8, Math.round(h * 0.45));
  playBtn.y = playY;
  playBtn.$on('tap', () => config.play());
  scene.addChild(playBtn);
  curY = playY + playSize.height + 12;

  // ── Zone C — Main Buttons (same width as play for alignment) ──
  if (config.zoneC && config.zoneC.length > 0) {
    const btnW = playSize.width;
    const btnH = 48;
    const gap = 12;

    for (const item of config.zoneC) {
      const def = isActionCode(item.id) ? ACTION_DEFAULTS[item.id] : undefined;
      const text = item.text ?? def?.text ?? item.id;
      // Zone C buttons are full-width — ignore ACTION_DEFAULTS variant (designed for icon buttons)
      // Only use explicit item.variant or default to 'secondary'
      const variant = item.variant ?? 'secondary';
      const disabled = resolveDisabled(item.disabled);

      const btn = new Button({
        id: item.id,
        text,
        variant,
        width: btnW,
        height: btnH,
        disabled,
      });
      btn.x = Math.round((w - btnW) / 2);
      btn.y = curY;

      const handler = resolveZoneHandler(item, config);
      btn.$on('tap', () => {
        if (!resolveDisabled(item.disabled)) handler(scene, config, app);
      });

      if (typeof item.disabled === 'function') {
        const getter = item.disabled;
        updaters.push(() => { btn.disabled = getter(); });
      }

      scene.addChild(btn);
      curY += btnH + gap;
    }
  }

  // ── Toggles (icon + switch, horizontally centered) ──
  if (config.toggles && config.toggles.length > 0) {
    const toggleY = curY + 8;
    const toggleGap = 36;
    const iconSz = 16;
    const iconToggleGap = 8;
    const toggleSw = 44;
    const toggleSh = 44;
    const itemW = iconSz + iconToggleGap + toggleSw;
    const totalTogglesW = config.toggles.length * itemW + (config.toggles.length - 1) * toggleGap;
    let tx = Math.round((w - totalTogglesW) / 2);

    for (const item of config.toggles) {
      // Icon
      const iconNode = new Icon({
        id: `toggle-${item.id}-icon`,
        name: item.value ? item.icon : (item.offIcon ?? item.icon),
        size: iconSz,
        color: item.value ? UIColors.text : UIColors.textSecondary,
      });
      iconNode.x = tx;
      iconNode.y = toggleY + Math.round((toggleSh - iconSz) / 2);
      scene.addChild(iconNode);

      // Toggle switch
      const toggle = new Toggle({
        id: `toggle-${item.id}`,
        label: '',
        value: item.value,
        width: toggleSw,
        height: toggleSh,
      });
      toggle.x = tx + iconSz + iconToggleGap;
      toggle.y = toggleY;
      toggle.$on('change', (val: boolean) => {
        item.onChange(val);
        iconNode.name = val ? item.icon : (item.offIcon ?? item.icon);
        iconNode.color = val ? UIColors.text : UIColors.textSecondary;
      });
      scene.addChild(toggle);
      tx += itemW + toggleGap;
    }

    curY = toggleY + 32;
  }

  // ── Footer links (help + restorePurchase) ──
  // Position these above Zone D
  const bottomAnchor = h - safeBottom - 8; // very bottom for version (respects safe area)
  const privacyY = bottomAnchor - 18; // privacy link (above version)
  const zoneDY = privacyY - 56; // zone D row (above privacy)
  const footerY = zoneDY - 32; // footer links (above zone D)

  if (config.help || config.restorePurchase) {
    let fx = Math.round(w / 2);
    const items: Array<{ id: string; text: string; handler: () => void }> = [];
    if (config.help) items.push({ id: 'help', text: '帮助', handler: config.help });
    if (config.restorePurchase) items.push({ id: 'restore', text: '恢复购买', handler: config.restorePurchase });

    const linkW = 80;
    const linkGap = 8;
    const totalLinkW = items.length * linkW + (items.length - 1) * linkGap;
    fx = Math.round((w - totalLinkW) / 2);

    for (const item of items) {
      const btn = new Button({
        id: item.id,
        text: item.text,
        variant: 'ghost',
        width: linkW,
        height: 24,
        fontSize: 11,
      });
      btn.x = fx;
      btn.y = footerY;
      btn.$on('tap', () => item.handler());
      scene.addChild(btn);
      fx += linkW + linkGap;
    }
  }

  // ── Zone D — Bottom Bar ──
  if (config.zoneD && config.zoneD.length > 0) {
    const count = config.zoneD.length;
    const hasCornerL = !!config.cornerLeft;
    const hasCornerR = !!config.cornerRight;
    const cornerSpace = 48;
    const availW = w - (hasCornerL ? cornerSpace : 0) - (hasCornerR ? cornerSpace : 0);
    const slotW = Math.floor(availW / count);
    let dx = hasCornerL ? cornerSpace : 0;

    for (const item of config.zoneD) {
      const def = isActionCode(item.id) ? ACTION_DEFAULTS[item.id] : undefined;
      const icon = item.icon ?? def?.icon;
      const text = item.text ?? def?.text ?? item.id;

      const disabled = resolveDisabled(item.disabled);
      const handler = resolveZoneHandler(item, config);

      // IconButton with optional label — single component, passes audit
      const btn = new IconButton({
        id: item.id,
        icon: icon ?? 'star',
        label: text,
        size: 32,
        width: slotW,
      });
      btn.x = dx;
      btn.y = zoneDY;
      if (disabled) btn.alpha = 0.5;
      btn.$on('tap', () => {
        if (!resolveDisabled(item.disabled)) handler(scene, config, app);
      });

      if (typeof item.disabled === 'function') {
        const getter = item.disabled;
        updaters.push(() => { btn.alpha = getter() ? 0.5 : 1; });
      }

      scene.addChild(btn);
      dx += slotW;
    }
  }

  // ── Corner Left ──
  if (config.cornerLeft) {
    const cl = config.cornerLeft;
    const btn = new IconButton({
      id: cl.id ?? 'corner-left',
      icon: cl.icon,
      size: 36,
    });
    btn.x = 12;
    btn.y = zoneDY + 4;
    btn.$on('tap', () => cl.onTap());
    scene.addChild(btn);
  }

  // ── Corner Right ──
  if (config.cornerRight) {
    const cr = config.cornerRight;
    const btn = new IconButton({
      id: cr.id ?? 'corner-right',
      icon: cr.icon,
      size: 36,
    });
    btn.x = w - 36 - 12;
    btn.y = zoneDY + 4;
    btn.$on('tap', () => cr.onTap());
    scene.addChild(btn);
  }

  // ── Privacy + Version (stacked at bottom, no overlap) ──
  // Version at very bottom
  let bottomY = h - 8;
  if (config.version) {
    const verLabel = new Label({
      id: 'version',
      text: config.version,
      fontSize: 10,
      color: UIColors.textSecondary,
      align: 'center',
      width: w,
      height: 14,
    });
    bottomY -= 14;
    verLabel.y = bottomY;
    verLabel.alpha = 0.5;
    scene.addChild(verLabel);
    bottomY -= 2;
  }

  // Privacy above version
  const privacyH = 28;
  bottomY -= privacyH;
  const privacyBtn = new Button({
    id: 'privacy',
    text: '隐私协议',
    variant: 'ghost',
    width: 120,
    height: privacyH,
    fontSize: 11,
  });
  privacyBtn.x = Math.round((w - 120) / 2);
  privacyBtn.y = bottomY;
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

  // ── Wire up refresh() ──
  scene.refresh = () => {
    for (const fn of updaters) fn();
  };

  // Auto-refresh on enter/resume
  const origOnEnter = scene.onEnter.bind(scene);
  scene.onEnter = () => {
    origOnEnter();
    scene.refresh();
  };
  scene.onResume = () => {
    scene.refresh();
  };
}

// ══════════════════════════════════════════
// Zone handler resolution
// ══════════════════════════════════════════

function resolveZoneHandler(
  item: ZoneButton,
  config: MenuConfig,
): (scene: TemplateScene, config: MenuConfig, app: TemplateApp) => void {
  if (item.onTap) {
    const handler = item.onTap;
    return () => handler();
  }
  // Auto-connect to dialog
  if (item.id === 'checkin' && config.checkin) {
    return (scene, config, app) => openCheckin(scene, config, app);
  }
  if (item.id === 'lucky-box' && config['lucky-box']) {
    return (scene, config, app) => openLuckyBox(scene, config, app);
  }
  // This should never happen — validated at createScene time
  return () => {};
}

// ══════════════════════════════════════════
// Dialog openers
// ══════════════════════════════════════════

function openSettings(scene: TemplateScene, config: MenuConfig, _app: TemplateApp): void {
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

function openPrivacy(_scene: TemplateScene, config: MenuConfig, app: TemplateApp): void {
  const page = new PrivacyPage({
    content: config.privacy.content,
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    showViewButton: !!config.privacy.onViewPolicy,
  });
  if (config.privacy.onViewPolicy) {
    page.$on('viewPolicy', () => config.privacy.onViewPolicy!());
  }
  page.$on('agree', () => app.router.pop());
  page.$on('back', () => app.router.pop());
  app.router.push(page as any);
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
