/**
 * Storage — 持久化存储抽象
 *
 * 统一 Web localStorage / 微信 wx.setStorageSync / 内存存储 的接口。
 * 所有运营系统通过 Storage 接口持久化数据，不直接依赖平台 API。
 */

export interface Storage {
  get<T = any>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: any): void;
  remove(key: string): void;
  has(key: string): boolean;
  clear(): void;
  keys(): string[];
}

/** 内存存储（测试用 / 不需要持久化时） */
export class MemoryStorage implements Storage {
  private _data = new Map<string, any>();

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    return this._data.has(key) ? this._data.get(key) : defaultValue;
  }

  set(key: string, value: any): void {
    this._data.set(key, value);
  }

  remove(key: string): void {
    this._data.delete(key);
  }

  has(key: string): boolean {
    return this._data.has(key);
  }

  clear(): void {
    this._data.clear();
  }

  keys(): string[] {
    return [...this._data.keys()];
  }
}

/** Web localStorage 适配 */
export class WebStorage implements Storage {
  private _prefix: string;

  constructor(prefix = 'lucid:') {
    this._prefix = prefix;
  }

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const raw = localStorage.getItem(this._prefix + key);
    if (raw === null) return defaultValue;
    try { return JSON.parse(raw); } catch { return defaultValue; }
  }

  set(key: string, value: any): void {
    localStorage.setItem(this._prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this._prefix + key);
  }

  has(key: string): boolean {
    return localStorage.getItem(this._prefix + key) !== null;
  }

  clear(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this._prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this._prefix)) result.push(k.slice(this._prefix.length));
    }
    return result;
  }
}

/** 根据环境自动选择存储实现 */
export function createStorage(prefix?: string): Storage {
  if (typeof localStorage !== 'undefined') {
    return new WebStorage(prefix);
  }
  return new MemoryStorage();
}
