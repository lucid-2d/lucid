/**
 * @lucid/game-ui — 游戏业务组件
 */

export { CheckinDialog, type CheckinDialogProps } from './checkin-dialog.js';
export { SettingsPanel, type SettingsPanelProps } from './settings-panel.js';
export { ResultPanel, type ResultPanelProps } from './result-panel.js';
export { ShopPanel, type ShopPanelProps, type ShopItem } from './shop-panel.js';
export { LeaderboardPanel, type LeaderboardPanelProps, type LeaderboardEntry } from './leaderboard-panel.js';
export { BattlePassPanel, type BattlePassPanelProps, type BattlePassReward } from './battle-pass-panel.js';
export { LuckyBoxDialog, type LuckyBoxDialogProps } from './lucky-box-dialog.js';
export { CoinShopPanel, type CoinShopPanelProps, type CoinShopItem } from './coin-shop-panel.js';
export { PrivacyPage, PrivacyDialog, type PrivacyDialogProps } from './privacy-dialog.js';
export { ConfirmDialog, type ConfirmDialogProps, type ConfirmAction } from './confirm-dialog.js';
export { PauseModal, type PauseModalProps, type PauseSettingsConfig } from './pause-modal.js';
export { TutorialOverlay, showTutorial, type TutorialStep, type TutorialOverlayProps } from './tutorial-overlay.js';

// Template system
export {
  createScene,
  TemplateScene, isTemplateScene,
  ACTION_DEFAULTS, ACTION_SIZES, getActionDef,
  type TemplateConfig, type TemplateName, type TemplateApp,
  type ActionCode, type ActionDef,
  type MenuConfig, type GameplayConfig, type ResultConfig, type MapConfig,
  type ShopConfig, type ListConfig, type PassConfig,
  type SettingsConfig, type PrivacyConfig, type CheckinConfig, type LuckyBoxConfig,
  type PauseConfig, type HudSlots, type AdAction, type StatEntry,
} from './templates/index.js';
