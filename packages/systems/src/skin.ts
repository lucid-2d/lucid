/**
 * SkinSystem — 皮肤/道具系统
 *
 * 管理物品的拥有状态、装备状态、分类查询。
 * 纯逻辑层，不负责 UI 渲染（搭配 @lucid/game-ui 的 ShopPanel 使用）。
 */

import type { Storage } from './storage.js';

export interface SkinDefinition {
  id: string;
  name: string;
  category: string;
  /** 免费（默认拥有） */
  free?: boolean;
  /** 价格（金币） */
  price?: number;
  /** 描述 */
  desc?: string;
  /** 图标 */
  icon?: string;
}

export interface SkinOptions {
  storage: Storage;
  skins: SkinDefinition[];
  prefix?: string;
}

type EventHandler = (...args: any[]) => void;

interface SkinData {
  owned: string[];
  equipped: Record<string, string>; // category → skinId
}

export class SkinSystem {
  private _storage: Storage;
  private _skins: SkinDefinition[];
  private _skinMap: Map<string, SkinDefinition>;
  private _key: string;
  private _handlers = new Map<string, EventHandler[]>();

  constructor(opts: SkinOptions) {
    this._storage = opts.storage;
    this._skins = opts.skins;
    this._skinMap = new Map(opts.skins.map(s => [s.id, s]));
    this._key = (opts.prefix ?? 'skin') + ':data';

    // 初始化：确保免费皮肤被拥有
    const data = this._load();
    let changed = false;
    for (const s of opts.skins) {
      if (s.free && !data.owned.includes(s.id)) {
        data.owned.push(s.id);
        changed = true;
      }
    }
    if (changed) this._save(data);
  }

  private _load(): SkinData {
    return this._storage.get<SkinData>(this._key, { owned: [], equipped: {} })!;
  }

  private _save(data: SkinData): void {
    this._storage.set(this._key, data);
  }

  // ── 查询 ──

  isOwned(id: string): boolean {
    return this._load().owned.includes(id);
  }

  getEquipped(category: string): string | undefined {
    return this._load().equipped[category];
  }

  getOwned(): string[] {
    return [...this._load().owned];
  }

  getSkinsByCategory(category: string): SkinDefinition[] {
    return this._skins.filter(s => s.category === category);
  }

  getSkin(id: string): SkinDefinition | undefined {
    return this._skinMap.get(id);
  }

  // ── 操作 ──

  /** 购买皮肤。返回 true = 成功，false = 已拥有或不存在 */
  purchase(id: string): boolean {
    if (!this._skinMap.has(id)) return false;
    const data = this._load();
    if (data.owned.includes(id)) return false;
    data.owned.push(id);
    this._save(data);
    this._emit('purchase', id);
    return true;
  }

  /** 装备皮肤。返回 true = 成功，false = 未拥有或不存在 */
  equip(id: string): boolean {
    const skin = this._skinMap.get(id);
    if (!skin) return false;
    if (!this.isOwned(id)) return false;
    const data = this._load();
    data.equipped[skin.category] = id;
    this._save(data);
    this._emit('equip', id, skin.category);
    return true;
  }

  // ── 事件 ──

  on(event: string, handler: EventHandler): void {
    const list = this._handlers.get(event) ?? [];
    list.push(handler);
    this._handlers.set(event, list);
  }

  off(event: string, handler: EventHandler): void {
    const list = this._handlers.get(event);
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  private _emit(event: string, ...args: any[]): void {
    const list = this._handlers.get(event);
    if (list) for (const h of list) h(...args);
  }
}
