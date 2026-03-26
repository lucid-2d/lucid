/**
 * Template system — declarative scene creation.
 */

export { createScene } from './create-scene.js';
export { TemplateScene, isTemplateScene } from './template-scene.js';
export { ACTION_DEFAULTS, ACTION_SIZES, getActionDef } from './actions.js';
export type {
  TemplateConfig, TemplateName, TemplateApp,
  ActionCode, ActionDef,
  MenuConfig, GameplayConfig, ResultConfig, MapConfig,
  ShopConfig, ListConfig, PassConfig,
  SettingsConfig, PrivacyConfig, CheckinConfig, LuckyBoxConfig,
  PauseConfig, HudSlots, AdAction, StatEntry, RankChange,
  ZoneBadge, ZoneButton, CornerItem, ToggleItem, ContinueGameConfig,
} from './types.js';
