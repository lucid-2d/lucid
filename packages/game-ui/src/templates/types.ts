/**
 * Template system types — declarative scene configuration.
 */

import type { UINode } from '@lucid-2d/core';
import type { IconName, ButtonVariant, TabItem } from '@lucid-2d/ui';
import type { ShopItem } from '../shop-panel.js';
import type { CoinShopItem } from '../coin-shop-panel.js';
import type { LeaderboardEntry } from '../leaderboard-panel.js';
import type { BattlePassReward } from '../battle-pass-panel.js';

/** Minimal app interface — avoids depending on @lucid-2d/engine */
export interface TemplateApp {
  screen: { width: number; height: number };
  router: { push(scene: any): void; replace(scene: any): void; pop(): void; current?: any };
  root: UINode;
  tick(dt: number): void;
}

// ══════════════════════════════════════════
// Action Code
// ══════════════════════════════════════════

export type ActionCode =
  // Navigation
  | 'play' | 'continue' | 'home' | 'back' | 'restart'
  // Game control
  | 'pause' | 'resume' | 'quit'
  // System
  | 'settings' | 'privacy' | 'dismiss'
  // Monetization
  | 'share' | 'ad' | 'revive'
  // Business entry
  | 'shop' | 'checkin' | 'leaderboard' | 'battlepass' | 'lucky-box'
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
  value: string;
}

// ══════════════════════════════════════════
// Scene Template Configs
// ══════════════════════════════════════════

export interface MenuConfig {
  template: 'menu';
  id?: string;
  title: string;
  subtitle?: string;

  // Required
  play: () => void;
  settings: SettingsConfig;
  privacy: PrivacyConfig;

  // Optional dialogs
  checkin?: CheckinConfig;
  'lucky-box'?: LuckyBoxConfig;

  // Optional scene navigation
  shop?: () => void;
  leaderboard?: () => void;
  battlepass?: () => void;
  endless?: () => void;

  // Custom rendering
  drawBackground?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  /** Custom content between title and play button */
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
