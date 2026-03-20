/**
 * MissionSystem — 任务系统
 *
 * 管理每日/生涯任务的进度追踪和奖励领取。
 * 每日任务在新的一天自动重置进度和领取状态。
 */

import type { Storage } from './storage.js';

export interface MissionDefinition {
  id: string;
  name: string;
  target: number;
  reward: number;
  /** 'daily' = 每日重置, 'lifetime' = 永久累计 */
  type: 'daily' | 'lifetime';
  /** 'cumulative'（默认）= 累加, 'max' = 取最大值 */
  progressType?: 'cumulative' | 'max';
  desc?: string;
  icon?: string;
}

export interface MissionStatus {
  id: string;
  name: string;
  target: number;
  reward: number;
  progress: number;
  complete: boolean;
  claimed: boolean;
}

export interface MissionOptions {
  storage: Storage;
  missions: MissionDefinition[];
  prefix?: string;
}

type EventHandler = (...args: any[]) => void;

interface MissionData {
  /** 每日任务的日期标记 */
  dailyDate: string;
  /** 进度 */
  progress: Record<string, number>;
  /** 已领取 */
  claimed: Record<string, boolean>;
}

function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class MissionSystem {
  private _storage: Storage;
  private _defs: MissionDefinition[];
  private _defMap: Map<string, MissionDefinition>;
  private _key: string;
  private _handlers = new Map<string, EventHandler[]>();

  constructor(opts: MissionOptions) {
    this._storage = opts.storage;
    this._defs = opts.missions;
    this._defMap = new Map(opts.missions.map(m => [m.id, m]));
    this._key = (opts.prefix ?? 'mission') + ':data';
  }

  private _load(): MissionData {
    const data = this._storage.get<MissionData>(this._key, { dailyDate: '', progress: {}, claimed: {} })!;
    const today = toDateKey(Date.now());

    // 每日任务重置检测
    if (data.dailyDate !== today) {
      for (const def of this._defs) {
        if (def.type === 'daily') {
          data.progress[def.id] = 0;
          data.claimed[def.id] = false;
        }
      }
      data.dailyDate = today;
      this._storage.set(this._key, data);
    }

    return data;
  }

  private _save(data: MissionData): void {
    this._storage.set(this._key, data);
  }

  addProgress(id: string, value: number): void {
    const def = this._defMap.get(id);
    if (!def) return;

    const data = this._load();
    const prev = data.progress[id] ?? 0;
    const pType = def.progressType ?? 'cumulative';
    const newVal = pType === 'max' ? Math.max(prev, value) : prev + value;
    data.progress[id] = newVal;
    this._save(data);

    if (newVal >= def.target && prev < def.target) {
      this._emit('complete', id);
    }
  }

  getProgress(id: string): number {
    return this._load().progress[id] ?? 0;
  }

  isComplete(id: string): boolean {
    const def = this._defMap.get(id);
    if (!def) return false;
    return this.getProgress(id) >= def.target;
  }

  isClaimed(id: string): boolean {
    return this._load().claimed[id] ?? false;
  }

  /** 领取奖励，返回奖励值（0 = 未完成或已领取） */
  claim(id: string): number {
    const def = this._defMap.get(id);
    if (!def) return 0;
    if (!this.isComplete(id)) return 0;

    const data = this._load();
    if (data.claimed[id]) return 0;
    data.claimed[id] = true;
    this._save(data);
    this._emit('claim', id, def.reward);
    return def.reward;
  }

  getAll(): MissionStatus[] {
    const data = this._load();
    return this._defs.map(d => ({
      id: d.id,
      name: d.name,
      target: d.target,
      reward: d.reward,
      progress: data.progress[d.id] ?? 0,
      complete: (data.progress[d.id] ?? 0) >= d.target,
      claimed: data.claimed[d.id] ?? false,
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
