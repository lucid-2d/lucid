/**
 * AchievementSystem — 成就系统
 *
 * 管理成就定义、进度追踪、解锁状态。
 * 支持累计型（addProgress 累加）和最大值型（addProgress 取 max）。
 */

import type { Storage } from './storage.js';

export interface AchievementDefinition {
  id: string;
  name: string;
  desc: string;
  target: number;
  /** 'cumulative'（默认）= 累加, 'max' = 取最大值 */
  type?: 'cumulative' | 'max';
  icon?: string;
  reward?: number;
}

export interface AchievementStatus {
  id: string;
  name: string;
  desc: string;
  target: number;
  progress: number;
  unlocked: boolean;
}

export interface AchievementOptions {
  storage: Storage;
  achievements: AchievementDefinition[];
  prefix?: string;
}

type EventHandler = (...args: any[]) => void;

interface AchievementData {
  progress: Record<string, number>;
  unlocked: string[];
}

export class AchievementSystem {
  private _storage: Storage;
  private _defs: AchievementDefinition[];
  private _defMap: Map<string, AchievementDefinition>;
  private _key: string;
  private _handlers = new Map<string, EventHandler[]>();

  constructor(opts: AchievementOptions) {
    this._storage = opts.storage;
    this._defs = opts.achievements;
    this._defMap = new Map(opts.achievements.map(a => [a.id, a]));
    this._key = (opts.prefix ?? 'achievement') + ':data';
  }

  private _load(): AchievementData {
    return this._storage.get<AchievementData>(this._key, { progress: {}, unlocked: [] })!;
  }

  private _save(data: AchievementData): void {
    this._storage.set(this._key, data);
  }

  addProgress(id: string, value: number): void {
    const def = this._defMap.get(id);
    if (!def) return;

    const data = this._load();
    if (data.unlocked.includes(id)) return;

    const prev = data.progress[id] ?? 0;
    const type = def.type ?? 'cumulative';
    data.progress[id] = type === 'max' ? Math.max(prev, value) : prev + value;

    if (data.progress[id] >= def.target && !data.unlocked.includes(id)) {
      data.unlocked.push(id);
      this._save(data);
      this._emit('unlock', id);
    } else {
      this._save(data);
    }
  }

  getProgress(id: string): number {
    return this._load().progress[id] ?? 0;
  }

  isUnlocked(id: string): boolean {
    return this._load().unlocked.includes(id);
  }

  getUnlocked(): string[] {
    return [...this._load().unlocked];
  }

  getAll(): AchievementStatus[] {
    const data = this._load();
    return this._defs.map(d => ({
      id: d.id,
      name: d.name,
      desc: d.desc,
      target: d.target,
      progress: data.progress[d.id] ?? 0,
      unlocked: data.unlocked.includes(d.id),
    }));
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
