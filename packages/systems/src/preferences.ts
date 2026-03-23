/**
 * Preferences — 用户设置自动持久化
 *
 * 键值存储 + 自动持久化 + 变化监听。一行代码让设置"记住"。
 *
 * ```typescript
 * import { createPreferences, createStorage } from '@lucid-2d/systems';
 *
 * const prefs = createPreferences({
 *   storage: createStorage('myapp:'),
 *   defaults: {
 *     sfxMuted: false,
 *     bgmMuted: false,
 *     language: 'zh',
 *   },
 * });
 *
 * prefs.get('sfxMuted');           // false（首次）或 true（上次保存的）
 * prefs.set('sfxMuted', true);     // 自动持久化
 * prefs.onChange('sfxMuted', (v) => audio.muted = v);
 * ```
 */

import type { Storage } from './storage.js';

export interface PreferencesOptions<T extends Record<string, any>> {
  storage: Storage;
  defaults: T;
  /** Storage key prefix (default: 'prefs:') */
  prefix?: string;
}

type ChangeHandler<V = any> = (value: V, key: string) => void;

export class Preferences<T extends Record<string, any> = Record<string, any>> {
  private _storage: Storage;
  private _defaults: T;
  private _prefix: string;
  private _cache: Record<string, any> = {};
  private _loaded = false;
  private _handlers = new Map<string, ChangeHandler[]>();

  constructor(opts: PreferencesOptions<T>) {
    this._storage = opts.storage;
    this._defaults = opts.defaults;
    this._prefix = opts.prefix ?? 'prefs:';
    this._load();
  }

  /** Get a preference value (from cache, falls back to default) */
  get<K extends keyof T>(key: K): T[K] {
    const k = key as string;
    if (k in this._cache) return this._cache[k] as T[K];
    return this._defaults[key];
  }

  /** Set a preference value (auto-persists + notifies listeners) */
  set<K extends keyof T>(key: K, value: T[K]): void {
    const k = key as string;
    const old = this.get(key);
    this._cache[k] = value;
    this._save(k, value);
    if (old !== value) {
      this._notify(k, value);
    }
  }

  /** Listen for changes to a specific key */
  onChange<K extends keyof T>(key: K, handler: ChangeHandler<T[K]>): void {
    const k = key as string;
    const list = this._handlers.get(k) ?? [];
    list.push(handler as ChangeHandler);
    this._handlers.set(k, list);
  }

  /** Remove a change listener */
  offChange<K extends keyof T>(key: K, handler: ChangeHandler<T[K]>): void {
    const k = key as string;
    const list = this._handlers.get(k);
    if (!list) return;
    const idx = list.indexOf(handler as ChangeHandler);
    if (idx >= 0) list.splice(idx, 1);
  }

  /** Reset a key to its default value */
  reset<K extends keyof T>(key: K): void {
    this.set(key, this._defaults[key]);
  }

  /** Reset all preferences to defaults */
  resetAll(): void {
    for (const key of Object.keys(this._defaults)) {
      this.reset(key as keyof T);
    }
  }

  /** Get all current values (cache merged with defaults) */
  getAll(): T {
    const result = { ...this._defaults };
    for (const key of Object.keys(this._cache)) {
      (result as any)[key] = this._cache[key];
    }
    return result;
  }

  private _load(): void {
    for (const key of Object.keys(this._defaults)) {
      const stored = this._storage.get(this._prefix + key);
      if (stored !== undefined) {
        this._cache[key] = stored;
      }
    }
    this._loaded = true;
  }

  private _save(key: string, value: any): void {
    this._storage.set(this._prefix + key, value);
  }

  private _notify(key: string, value: any): void {
    const list = this._handlers.get(key);
    if (list) {
      for (const h of list) h(value, key);
    }
  }
}

/** Create a Preferences instance */
export function createPreferences<T extends Record<string, any>>(
  opts: PreferencesOptions<T>,
): Preferences<T> {
  return new Preferences(opts);
}
