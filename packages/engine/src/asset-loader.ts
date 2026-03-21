/**
 * AssetLoader — batch asset loading with progress tracking.
 *
 * ```typescript
 * const loader = new AssetLoader();
 * loader.add('bg', 'assets/bg.png');
 * loader.add('player', 'assets/player.png');
 * loader.add('hit', 'assets/hit.mp3');
 *
 * loader.onProgress = (loaded, total) => {
 *   progressBar.value = loaded / total;
 * };
 *
 * const assets = await loader.load();
 * const bgImage = assets.get('bg');
 * ```
 */

import { loadImage } from './image-loader.js';

export interface AssetEntry {
  name: string;
  src: string;
  type: 'image' | 'audio' | 'json';
}

export class AssetLoader {
  private _entries: AssetEntry[] = [];
  private _assets = new Map<string, any>();
  private _loaded = 0;

  /** Progress callback: (loaded, total) */
  onProgress: ((loaded: number, total: number) => void) | null = null;

  /** Add an asset to load. Type is auto-detected from extension. */
  add(name: string, src: string, type?: 'image' | 'audio' | 'json'): this {
    const detected = type ?? this._detectType(src);
    this._entries.push({ name, src, type: detected });
    return this;
  }

  /** Load all registered assets. Returns a Map of name → loaded asset. */
  async load(): Promise<Map<string, any>> {
    this._loaded = 0;
    const total = this._entries.length;

    const promises = this._entries.map(async (entry) => {
      try {
        const asset = await this._loadOne(entry);
        this._assets.set(entry.name, asset);
      } catch (e) {
        console.warn(`[AssetLoader] Failed to load "${entry.name}" (${entry.src}):`, e);
        this._assets.set(entry.name, null);
      }
      this._loaded++;
      this.onProgress?.(this._loaded, total);
    });

    await Promise.all(promises);
    return this._assets;
  }

  /** Get a loaded asset by name */
  get(name: string): any {
    return this._assets.get(name);
  }

  /** Check if an asset is loaded */
  has(name: string): boolean {
    return this._assets.has(name);
  }

  /** Current progress (0..1) */
  get progress(): number {
    return this._entries.length === 0 ? 1 : this._loaded / this._entries.length;
  }

  /** Total number of assets registered */
  get total(): number {
    return this._entries.length;
  }

  /** Number of assets loaded so far */
  get loaded(): number {
    return this._loaded;
  }

  private async _loadOne(entry: AssetEntry): Promise<any> {
    switch (entry.type) {
      case 'image':
        return loadImage(entry.src);
      case 'json':
        return this._loadJson(entry.src);
      case 'audio':
        // Audio files are just stored as src strings;
        // actual loading happens via AudioManager.load()
        return entry.src;
      default:
        return entry.src;
    }
  }

  private async _loadJson(src: string): Promise<any> {
    // Platform-aware JSON loading
    if (typeof fetch !== 'undefined') {
      const res = await fetch(src);
      return res.json();
    }
    // WeChat/Douyin: use filesystem API
    const fs = (globalThis as any).wx?.getFileSystemManager?.() ??
               (globalThis as any).tt?.getFileSystemManager?.();
    if (fs) {
      return new Promise((resolve, reject) => {
        fs.readFile({
          filePath: src,
          encoding: 'utf8',
          success: (res: any) => resolve(JSON.parse(res.data)),
          fail: reject,
        });
      });
    }
    throw new Error(`Cannot load JSON: ${src}`);
  }

  private _detectType(src: string): 'image' | 'audio' | 'json' {
    const ext = src.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'json') return 'json';
    return 'image'; // default
  }
}
