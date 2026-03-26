/**
 * Template system types — declarative scene configuration.
 */

import type { UINode, SceneNode } from '@lucid-2d/core';
import type { IconName, ButtonVariant, TabItem } from '@lucid-2d/ui';
import type { ShopItem } from '../shop-panel.js';
import type { CoinShopItem } from '../coin-shop-panel.js';
import type { LeaderboardEntry } from '../leaderboard-panel.js';
import type { BattlePassReward } from '../battle-pass-panel.js';

/** Minimal app interface — avoids depending on @lucid-2d/engine */
export interface TemplateApp {
  screen: { width: number; height: number; safeTop?: number; safeBottom?: number };
  router: { push(scene: SceneNode): void; replace(scene: SceneNode): void; pop(): void; current?: SceneNode };
  root: UINode;
  tick(dt: number): void;
}

// ══════════════════════════════════════════
// Action Code
// ══════════════════════════════════════════

export type ActionCode =
  // Navigation
  | 'play' | 'continue' | 'home' | 'back' | 'restart' | 'endless'
  // Game control
  | 'pause' | 'resume' | 'quit'
  // System
  | 'settings' | 'privacy' | 'dismiss'
  // Monetization
  | 'share' | 'ad' | 'revive' | 'double-reward'
  // Business entry
  | 'shop' | 'checkin' | 'leaderboard' | 'battlepass' | 'lucky-box'
  | 'achievements' | 'missions' | 'daily-challenge'
  // Generic
  | 'confirm' | 'cancel' | 'claim' | 'buy' | 'equip' | 'select';

export interface ActionDef {
  icon?: IconName;
  text: string;
  variant: ButtonVariant;
  size: 'lg' | 'md' | 'sm' | 'icon';
}

// ══════════════════════════════════════════
// Dialog configs (sub-templates)
// ══════════════════════════════════════════

export interface SettingsConfig {
  toggles: Array<{ id: string; label: string; value: boolean }>;
  links?: Array<{ id: string; label: string }>;
  version?: string;
  onToggle: (id: string, value: boolean) => void;
  onLink?: (id: string) => void;
}

export interface PrivacyConfig {
  content: string;
  onViewPolicy?: () => void;
}

export interface CheckinConfig {
  rewards: number[];
  currentDay: number;
  claimed: boolean;
  onClaim: () => void;
}

export interface LuckyBoxConfig {
  fragments: number;
  redeemCost: number;
  freeOpens: number;
  adOpens: number;
  onOpen?: () => void;
  onOpenByAd?: () => void;
  onRedeem?: () => void;
}

// ══════════════════════════════════════════
// HUD config
// ══════════════════════════════════════════

export interface HudSlots {
  [key: string]: () => string | number;
}

// ══════════════════════════════════════════
// Pause config
// ══════════════════════════════════════════

export interface PauseConfig {
  restart: () => void;
  home: () => void;
  settings?: SettingsConfig;
  quit?: () => void;
}

// ══════════════════════════════════════════
// Ad button config
// ══════════════════════════════════════════

export interface AdAction {
  text?: string;
  onTap: () => void;
}

// ══════════════════════════════════════════
// Stat display
// ══════════════════════════════════════════

export interface StatEntry {
  icon: IconName;
  label: string;
  value: string | (() => string);
}

// ══════════════════════════════════════════
// Menu Zone types
// ══════════════════════════════════════════

/** Zone A — top status badge (coin balance, mission entry, etc.) */
export interface ZoneBadge {
  id: string;
  icon?: IconName;
  text?: string | (() => string);
  badge?: number | boolean | (() => number | boolean);
  onTap: () => void;
}

/** Zone C / Zone D — configurable button */
export interface ZoneButton {
  id: string;
  text?: string;
  icon?: IconName;
  variant?: ButtonVariant;
  badge?: number | boolean | (() => number | boolean);
  disabled?: boolean | (() => boolean);
  /** If omitted and id matches a dialog config key (checkin/lucky-box), auto-connects */
  onTap?: () => void;
}

/** Corner element (bottom-left or bottom-right) */
export interface CornerItem {
  id?: string;
  icon: IconName;
  text?: string | (() => string);
  onTap: () => void;
}

/** Toggle switch (sound, vibration, etc.) */
export interface ToggleItem {
  id: string;
  icon: IconName;
  offIcon?: IconName;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Continue game config */
export interface ContinueGameConfig {
  label: string;
  sublabel?: string;
  onTap: () => void;
}

// ══════════════════════════════════════════
// Scene Template Configs
// ══════════════════════════════════════════

export interface MenuConfig {
  template: 'menu';
  id?: string;

  // ── Required ──
  play: () => void;
  settings: SettingsConfig;
  privacy: PrivacyConfig;

  // ── Title Area ──
  title: string;
  subtitle?: string;
  bestScore?: number | (() => number);
  stats?: StatEntry[];

  // ── Zone A — Top Status Badges ──
  zoneA?: ZoneBadge[];

  // ── Continue Game ──
  continueGame?: ContinueGameConfig;

  // ── Zone C — Main Buttons (max 3, play is always first) ──
  zoneC?: ZoneButton[];

  // ── Toggles ──
  toggles?: ToggleItem[];

  // ── Zone D — Bottom Bar (max 4, evenly distributed) ──
  zoneD?: ZoneButton[];

  // ── Corner Elements ──
  cornerLeft?: CornerItem;
  cornerRight?: CornerItem;

  // ── Footer ──
  help?: () => void;
  restorePurchase?: () => void;
  version?: string;

  // ── Auto-Dialogs ──
  checkin?: CheckinConfig;
  'lucky-box'?: LuckyBoxConfig;

  // ── Custom ──
  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  heroContent?: (parent: UINode) => void;
}

export interface GameplayConfig {
  template: 'gameplay';
  id?: string;

  // Required
  pause: PauseConfig;
  setup: (gameArea: UINode, app: TemplateApp) => void;

  // Optional
  hud?: HudSlots;
  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/** Rank change display (e.g. "排名 5→3 ↑") */
export interface RankChange {
  from: number;
  to: number;
}

export interface ResultConfig {
  template: 'result';
  id?: string;
  title: string;
  score: number;
  isNewBest?: boolean;
  stats?: StatEntry[];

  // At least one of restart/home required (validated at creation)
  restart?: () => void;
  home?: () => void;
  share?: () => void;
  ad?: AdAction;
  revive?: AdAction;

  // v0.6.0 additions
  /** Revive countdown in seconds. When 0, revive button disappears. Requires revive. */
  countdown?: number;
  /** "Watch ad for double reward" — second ad trigger point */
  doubleReward?: AdAction;
  /** Rank change display below score */
  rankChange?: RankChange;

  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface MapConfig {
  template: 'map';
  id?: string;
  title?: string;

  // Required
  back: () => void;
  setup: (mapArea: UINode, app: TemplateApp) => void;

  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface ShopConfig {
  template: 'shop';
  id?: string;
  variant: 'skin' | 'coin';

  // Required
  back: () => void;

  // Skin shop
  tabs?: TabItem[];
  items?: ShopItem[];
  onPurchase?: (item: ShopItem) => void;
  onEquip?: (item: ShopItem) => void;

  // Coin shop
  coins?: number;
  coinItems?: CoinShopItem[];
  onCoinPurchase?: (item: CoinShopItem) => void;

  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface ListConfig {
  template: 'list';
  id?: string;
  variant: 'leaderboard';

  // Required
  back: () => void;

  entries: LeaderboardEntry[];
  tabs?: TabItem[];
  myEntry?: LeaderboardEntry;

  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface PassConfig {
  template: 'pass';
  id?: string;

  // Required
  back: () => void;

  currentLevel: number;
  currentXP: number;
  xpToNext: number;
  isPremium: boolean;
  rewards: BattlePassReward[];
  seasonName?: string;
  onClaim?: (level: number, type: 'free' | 'paid') => void;
  onBuyPremium?: () => void;

  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

// ══════════════════════════════════════════
// Union type
// ══════════════════════════════════════════

export type TemplateConfig =
  | MenuConfig
  | GameplayConfig
  | ResultConfig
  | MapConfig
  | ShopConfig
  | ListConfig
  | PassConfig;

export type TemplateName = TemplateConfig['template'];
