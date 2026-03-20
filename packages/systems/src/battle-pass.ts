/**
 * BattlePassSystem — 战令系统
 *
 * 管理赛季通行证：XP 积累、等级提升、双轨奖励（免费/付费）、付费解锁。
 */

import type { Storage } from './storage.js';

export interface BattlePassRewardItem {
  id: string;
  amount: number;
}

export interface BattlePassLevelReward {
  level: number;
  freeReward?: BattlePassRewardItem;
  paidReward?: BattlePassRewardItem;
}

export interface BattlePassConfig {
  maxLevel: number;
  xpPerLevel: number;
  rewards: BattlePassLevelReward[];
}

export interface BattlePassState {
  level: number;
  xp: number;
  xpToNext: number;
  isPremium: boolean;
  maxLevel: number;
}

export interface BattlePassOptions {
  storage: Storage;
  config: BattlePassConfig;
  prefix?: string;
}

type EventHandler = (...args: any[]) => void;

interface BPData {
  level: number;
  xp: number;
  isPremium: boolean;
  freeClaimed: number[];
  paidClaimed: number[];
}

export class BattlePassSystem {
  private _storage: Storage;
  private _config: BattlePassConfig;
  private _key: string;
  private _handlers = new Map<string, EventHandler[]>();

  constructor(opts: BattlePassOptions) {
    this._storage = opts.storage;
    this._config = opts.config;
    this._key = (opts.prefix ?? 'battlepass') + ':data';
  }

  private _load(): BPData {
    return this._storage.get<BPData>(this._key, {
      level: 1, xp: 0, isPremium: false, freeClaimed: [], paidClaimed: [],
    })!;
  }

  private _save(data: BPData): void {
    this._storage.set(this._key, data);
  }

  getState(): BattlePassState {
    const data = this._load();
    return {
      level: data.level,
      xp: data.xp,
      xpToNext: this._config.xpPerLevel,
      isPremium: data.isPremium,
      maxLevel: this._config.maxLevel,
    };
  }

  addXP(amount: number): void {
    const data = this._load();
    data.xp += amount;

    while (data.xp >= this._config.xpPerLevel && data.level < this._config.maxLevel) {
      data.xp -= this._config.xpPerLevel;
      data.level++;
      this._save(data);
      this._emit('levelUp', data.level);
    }

    if (data.level >= this._config.maxLevel) {
      data.xp = Math.min(data.xp, this._config.xpPerLevel);
    }

    this._save(data);
  }

  unlockPremium(): void {
    const data = this._load();
    data.isPremium = true;
    this._save(data);
  }

  claimFree(level: number): BattlePassRewardItem | null {
    const data = this._load();
    if (level > data.level) return null;
    if (data.freeClaimed.includes(level)) return null;

    const lr = this._config.rewards.find(r => r.level === level);
    if (!lr?.freeReward) return null;

    data.freeClaimed.push(level);
    this._save(data);
    this._emit('claimFree', level, lr.freeReward);
    return lr.freeReward;
  }

  claimPaid(level: number): BattlePassRewardItem | null {
    const data = this._load();
    if (!data.isPremium) return null;
    if (level > data.level) return null;
    if (data.paidClaimed.includes(level)) return null;

    const lr = this._config.rewards.find(r => r.level === level);
    if (!lr?.paidReward) return null;

    data.paidClaimed.push(level);
    this._save(data);
    this._emit('claimPaid', level, lr.paidReward);
    return lr.paidReward;
  }

  isFreeClaimed(level: number): boolean {
    return this._load().freeClaimed.includes(level);
  }

  isPaidClaimed(level: number): boolean {
    return this._load().paidClaimed.includes(level);
  }

  on(event: string, handler: EventHandler): void {
    const list = this._handlers.get(event) ?? [];
    list.push(handler);
    this._handlers.set(event, list);
  }

  private _emit(event: string, ...args: any[]): void {
    const list = this._handlers.get(event);
    if (list) for (const h of list) h(...args);
  }
}
