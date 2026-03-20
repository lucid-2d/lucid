/**
 * CheckinSystem — 签到逻辑
 *
 * 管理每日签到状态：连续天数、奖励发放、断签重置、周期循环。
 * 纯逻辑层，不负责 UI 渲染（搭配 @lucid/game-ui 的 CheckinDialog 使用）。
 */

import type { Storage } from './storage.js';

export interface CheckinOptions {
  storage: Storage;
  /** 每天的奖励值（数组长度 = 一个周期天数） */
  rewards: number[];
  /** storage key 前缀 */
  prefix?: string;
}

export interface CheckinState {
  /** 当前是第几天（0-based，在 rewards 数组中的索引） */
  currentDay: number;
  /** 今日是否已签到 */
  claimed: boolean;
  /** 连续签到天数 */
  streak: number;
  /** 奖励列表 */
  rewards: number[];
}

interface CheckinData {
  /** 上次签到日期 YYYY-MM-DD */
  lastDate: string;
  /** 连续签到天数 */
  streak: number;
}

function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z').getTime();
  const b = new Date(dateB + 'T00:00:00Z').getTime();
  return Math.round(Math.abs(b - a) / (24 * 60 * 60 * 1000));
}

export class CheckinSystem {
  private _storage: Storage;
  private _rewards: number[];
  private _key: string;

  constructor(opts: CheckinOptions) {
    this._storage = opts.storage;
    this._rewards = opts.rewards;
    this._key = (opts.prefix ?? 'checkin') + ':data';
  }

  private _load(): CheckinData {
    return this._storage.get<CheckinData>(this._key, { lastDate: '', streak: 0 })!;
  }

  private _save(data: CheckinData): void {
    this._storage.set(this._key, data);
  }

  /** 获取当前签到状态 */
  getState(): CheckinState {
    const data = this._load();
    const today = toDateKey(Date.now());
    const cycleDays = this._rewards.length;

    if (!data.lastDate) {
      return { currentDay: 0, claimed: false, streak: 0, rewards: this._rewards };
    }

    const gap = daysBetween(data.lastDate, today);

    if (gap === 0) {
      // 今天已签到
      const currentDay = (data.streak - 1) % cycleDays;
      return { currentDay, claimed: true, streak: data.streak, rewards: this._rewards };
    }

    if (gap === 1) {
      // 昨天签了，今天还没签，连续有效
      const currentDay = data.streak % cycleDays;
      return { currentDay, claimed: false, streak: data.streak, rewards: this._rewards };
    }

    // 超过一天没签，断签重置
    return { currentDay: 0, claimed: false, streak: 0, rewards: this._rewards };
  }

  /** 签到，返回获得的奖励值（0 = 已签过或失败） */
  claim(): number {
    const state = this.getState();
    if (state.claimed) return 0;

    const reward = this._rewards[state.currentDay];
    const today = toDateKey(Date.now());

    this._save({
      lastDate: today,
      streak: state.streak + 1,
    });

    return reward;
  }

  /** 获取指定天的奖励 */
  getReward(day: number): number {
    return this._rewards[day] ?? 0;
  }
}
