/**
 * Action Code defaults — icon, text, variant, size for each action.
 */

import type { ActionCode, ActionDef } from './types.js';

export const ACTION_DEFAULTS: Record<ActionCode, ActionDef> = {
  // Navigation
  play:       { icon: 'play',    text: '开始游戏',   variant: 'primary',   size: 'lg' },
  continue:   { icon: 'play',    text: '继续',       variant: 'primary',   size: 'lg' },
  home:       { icon: 'home',    text: '返回主页',   variant: 'secondary', size: 'md' },
  back:       { icon: 'back',    text: '返回',       variant: 'ghost',     size: 'icon' },
  restart:    { icon: 'retry',   text: '再来一局',   variant: 'secondary', size: 'md' },
  endless:    { icon: 'play',    text: '无尽模式',   variant: 'outline',   size: 'lg' },

  // Game control
  pause:      { icon: 'pause',   text: '',           variant: 'ghost',     size: 'icon' },
  resume:     { icon: 'play',    text: '继续游戏',   variant: 'primary',   size: 'md' },
  quit:       { icon: 'close',   text: '放弃',       variant: 'danger',    size: 'md' },

  // System
  settings:   { icon: 'settings',text: '设置',       variant: 'ghost',     size: 'icon' },
  privacy:    {                   text: '隐私协议',   variant: 'ghost',     size: 'sm' },
  dismiss:    { icon: 'close',   text: '×',          variant: 'ghost',     size: 'icon' },

  // Monetization
  share:      { icon: 'share',   text: '分享',       variant: 'outline',   size: 'md' },
  ad:              { icon: 'ad-video',text: '看广告',     variant: 'gold',      size: 'md' },
  revive:          { icon: 'heart',   text: '复活',       variant: 'gold',      size: 'md' },
  'double-reward': { icon: 'ad-video',text: '双倍奖励',   variant: 'gold',      size: 'md' },

  // Business entry
  shop:       { icon: 'coin',    text: '商店',       variant: 'ghost',     size: 'icon' },
  checkin:    { icon: 'checkin', text: '签到',       variant: 'ghost',     size: 'icon' },
  leaderboard:{ icon: 'trophy',  text: '排行',       variant: 'ghost',     size: 'icon' },
  battlepass: { icon: 'battle-pass', text: '战令',   variant: 'ghost',     size: 'icon' },
  'lucky-box':{ icon: 'gift',    text: '宝箱',       variant: 'ghost',     size: 'icon' },
  achievements:{ icon: 'achievement', text: '成就',  variant: 'ghost',     size: 'icon' },
  missions:   { icon: 'mission', text: '任务',       variant: 'ghost',     size: 'icon' },
  'daily-challenge': { icon: 'clock', text: '每日挑战', variant: 'secondary', size: 'md' },

  // Generic
  confirm:    {                   text: '确认',       variant: 'primary',   size: 'md' },
  cancel:     {                   text: '取消',       variant: 'secondary', size: 'md' },
  claim:      {                   text: '领取',       variant: 'primary',   size: 'md' },
  buy:        { icon: 'coin',    text: '购买',       variant: 'gold',      size: 'md' },
  equip:      {                   text: '装备',       variant: 'primary',   size: 'md' },
  select:     {                   text: '选择',       variant: 'primary',   size: 'md' },
};

/** Button width/height for each size */
export const ACTION_SIZES: Record<ActionDef['size'], { width: number; height: number }> = {
  lg:   { width: 240, height: 54 },
  md:   { width: 180, height: 48 },
  sm:   { width: 120, height: 36 },
  icon: { width: 44,  height: 44 },
};

export function getActionDef(code: ActionCode): ActionDef {
  return ACTION_DEFAULTS[code];
}
