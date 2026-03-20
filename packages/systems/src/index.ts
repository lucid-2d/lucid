/**
 * @lucid/systems — 游戏运营系统
 */

// 存储
export { type Storage, MemoryStorage, WebStorage, createStorage } from './storage.js';

// 签到
export { CheckinSystem, type CheckinOptions, type CheckinState } from './checkin.js';

// 皮肤/道具
export { SkinSystem, type SkinDefinition, type SkinOptions } from './skin.js';

// 成就
export { AchievementSystem, type AchievementDefinition, type AchievementStatus, type AchievementOptions } from './achievement.js';

// 任务
export { MissionSystem, type MissionDefinition, type MissionStatus, type MissionOptions } from './mission.js';

// 战令
export { BattlePassSystem, type BattlePassConfig, type BattlePassRewardItem, type BattlePassLevelReward, type BattlePassState, type BattlePassOptions } from './battle-pass.js';

// 广告
export { AdSystem, NoopAdAdapter, type AdAdapter, type AdOptions } from './ad.js';

// 支付
export { IAPSystem, NoopIAPAdapter, type IAPAdapter, type IAPProduct, type IAPOptions } from './iap.js';

// 分享
export { ShareSystem, WebShareAdapter, type ShareAdapter, type ShareData, type ShareOptions } from './share.js';

// 埋点
export { AnalyticsSystem, ConsoleAnalyticsAdapter, NoopAnalyticsAdapter, type AnalyticsAdapter, type AnalyticsOptions } from './analytics.js';
