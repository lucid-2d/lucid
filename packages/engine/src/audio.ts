/**
 * Audio system — cross-platform sound effects and background music.
 *
 * Supports Web (HTMLAudioElement), WeChat (wx.createInnerAudioContext),
 * and Douyin (tt.createInnerAudioContext).
 *
 * ```typescript
 * const audio = createAudio();
 * await audio.load('hit', 'assets/hit.mp3');
 * audio.playSfx('hit');
 * audio.playBgm('menu-bgm');
 * ```
 */

import { detectPlatform, type PlatformName } from './platform/detect.js';

// ── Audio Adapter Interface ──

export interface AudioHandle {
  play(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  volume: number;
  loop: boolean;
  readonly playing: boolean;
  destroy(): void;
}

export interface AudioAdapter {
  /** Create an audio handle from a source URL */
  create(src: string): AudioHandle;
  /** Clone an existing handle for overlapping SFX playback */
  clone(handle: AudioHandle): AudioHandle;
}

// ── Web Audio Adapter ──

class WebAudioHandle implements AudioHandle {
  private _el: HTMLAudioElement;
  private _playing = false;

  constructor(src: string) {
    this._el = new Audio(src);
    this._el.addEventListener('ended', () => { this._playing = false; });
  }

  play() {
    this._el.currentTime = 0;
    this._el.play().catch(() => {});
    this._playing = true;
  }
  stop() {
    this._el.pause();
    this._el.currentTime = 0;
    this._playing = false;
  }
  pause() {
    this._el.pause();
    this._playing = false;
  }
  resume() {
    this._el.play().catch(() => {});
    this._playing = true;
  }

  get volume() { return this._el.volume; }
  set volume(v: number) { this._el.volume = Math.max(0, Math.min(1, v)); }

  get loop() { return this._el.loop; }
  set loop(v: boolean) { this._el.loop = v; }

  get playing() { return this._playing && !this._el.paused; }

  destroy() {
    this.stop();
    this._el.src = '';
  }

  get element() { return this._el; }
}

class WebAudioAdapter implements AudioAdapter {
  create(src: string): AudioHandle {
    return new WebAudioHandle(src);
  }
  clone(handle: AudioHandle): AudioHandle {
    const orig = handle as WebAudioHandle;
    return new WebAudioHandle(orig.element.src);
  }
}

// ── Mini Game Audio Adapter (WeChat / Douyin) ──

class MiniGameAudioHandle implements AudioHandle {
  private _ctx: any;
  private _playing = false;

  constructor(src: string, api: any) {
    this._ctx = api.createInnerAudioContext();
    this._ctx.src = src;
    this._ctx.onEnded(() => { this._playing = false; });
  }

  play() {
    this._ctx.seek(0);
    this._ctx.play();
    this._playing = true;
  }
  stop() {
    this._ctx.stop();
    this._playing = false;
  }
  pause() {
    this._ctx.pause();
    this._playing = false;
  }
  resume() {
    this._ctx.play();
    this._playing = true;
  }

  get volume() { return this._ctx.volume; }
  set volume(v: number) { this._ctx.volume = Math.max(0, Math.min(1, v)); }

  get loop() { return this._ctx.loop; }
  set loop(v: boolean) { this._ctx.loop = v; }

  get playing() { return this._playing; }

  destroy() {
    this._ctx.destroy();
  }

  get src() { return this._ctx.src; }
  get api() {
    // Detect which API to use for cloning
    if (typeof (globalThis as any).tt !== 'undefined') return (globalThis as any).tt;
    return (globalThis as any).wx;
  }
}

class MiniGameAudioAdapter implements AudioAdapter {
  private _api: any;

  constructor(api: any) {
    this._api = api;
  }

  create(src: string): AudioHandle {
    return new MiniGameAudioHandle(src, this._api);
  }
  clone(handle: AudioHandle): AudioHandle {
    const orig = handle as MiniGameAudioHandle;
    return new MiniGameAudioHandle(orig.src, this._api);
  }
}

// ── Mock Audio Adapter (for testing) ──

class MockAudioHandle implements AudioHandle {
  private _playing = false;
  volume = 1;
  loop = false;
  readonly src: string;

  constructor(src: string) { this.src = src; }

  play() { this._playing = true; }
  stop() { this._playing = false; }
  pause() { this._playing = false; }
  resume() { this._playing = true; }
  get playing() { return this._playing; }
  destroy() { this._playing = false; }
}

class MockAudioAdapter implements AudioAdapter {
  create(src: string): AudioHandle { return new MockAudioHandle(src); }
  clone(handle: AudioHandle): AudioHandle {
    return new MockAudioHandle((handle as MockAudioHandle).src);
  }
}

// ── AudioManager ──

export interface AudioManagerOptions {
  /** Platform override (auto-detects if not specified) */
  platform?: PlatformName;
  /** Custom adapter */
  adapter?: AudioAdapter;
  /** Max concurrent SFX of the same name (default: 4) */
  maxConcurrent?: number;
}

export class AudioManager {
  private _adapter: AudioAdapter;
  private _sounds = new Map<string, AudioHandle>();
  private _activeSfx: AudioHandle[] = [];
  private _bgmHandle: AudioHandle | null = null;
  private _bgmName = '';
  private _sfxVolume = 1;
  private _bgmVolume = 1;
  private _muted = false;
  private _maxConcurrent: number;

  constructor(opts?: AudioManagerOptions) {
    if (opts?.adapter) {
      this._adapter = opts.adapter;
    } else {
      const platform = opts?.platform ?? detectPlatform();
      if (platform === 'wx') {
        this._adapter = new MiniGameAudioAdapter((globalThis as any).wx);
      } else if (platform === 'tt') {
        this._adapter = new MiniGameAudioAdapter((globalThis as any).tt);
      } else {
        // Web or fallback
        if (typeof Audio !== 'undefined') {
          this._adapter = new WebAudioAdapter();
        } else {
          this._adapter = new MockAudioAdapter();
        }
      }
    }
    this._maxConcurrent = opts?.maxConcurrent ?? 4;
  }

  /** Pre-load an audio file */
  load(name: string, src: string): void {
    if (this._sounds.has(name)) return;
    this._sounds.set(name, this._adapter.create(src));
  }

  /** Check if a sound is loaded */
  has(name: string): boolean {
    return this._sounds.has(name);
  }

  // ── SFX ──

  /** Play a sound effect (can overlap) */
  playSfx(name: string, volume?: number): void {
    const base = this._sounds.get(name);
    if (!base) return;
    if (this._muted) return;

    // Clean up finished SFX
    this._activeSfx = this._activeSfx.filter(h => h.playing);

    // Limit concurrent instances
    if (this._activeSfx.length >= this._maxConcurrent) {
      const oldest = this._activeSfx.shift();
      oldest?.stop();
      oldest?.destroy();
    }

    const handle = this._adapter.clone(base);
    handle.volume = (volume ?? 1) * this._sfxVolume;
    handle.loop = false;
    handle.play();
    this._activeSfx.push(handle);
  }

  /** Stop all active sound effects */
  stopAllSfx(): void {
    for (const h of this._activeSfx) {
      h.stop();
      h.destroy();
    }
    this._activeSfx = [];
  }

  // ── BGM ──

  /** Play background music (stops current BGM if any) */
  playBgm(name: string, opts?: { loop?: boolean; volume?: number }): void {
    if (this._bgmName === name && this._bgmHandle?.playing) return;

    this.stopBgm();

    const base = this._sounds.get(name);
    if (!base) return;

    this._bgmHandle = this._adapter.clone(base);
    this._bgmName = name;
    this._bgmHandle.loop = opts?.loop ?? true;
    this._bgmHandle.volume = (opts?.volume ?? 1) * this._bgmVolume * (this._muted ? 0 : 1);
    this._bgmHandle.play();
  }

  /** Stop background music */
  stopBgm(): void {
    if (this._bgmHandle) {
      this._bgmHandle.stop();
      this._bgmHandle.destroy();
      this._bgmHandle = null;
      this._bgmName = '';
    }
  }

  /** Pause background music */
  pauseBgm(): void {
    this._bgmHandle?.pause();
  }

  /** Resume background music */
  resumeBgm(): void {
    if (this._bgmHandle && !this._muted) {
      this._bgmHandle.resume();
    }
  }

  /** Currently playing BGM name */
  get currentBgm(): string { return this._bgmName; }

  // ── Volume ──

  get sfxVolume(): number { return this._sfxVolume; }
  set sfxVolume(v: number) { this._sfxVolume = Math.max(0, Math.min(1, v)); }

  get bgmVolume(): number { return this._bgmVolume; }
  set bgmVolume(v: number) {
    this._bgmVolume = Math.max(0, Math.min(1, v));
    if (this._bgmHandle) {
      this._bgmHandle.volume = this._bgmVolume * (this._muted ? 0 : 1);
    }
  }

  get muted(): boolean { return this._muted; }
  set muted(v: boolean) {
    this._muted = v;
    if (this._bgmHandle) {
      this._bgmHandle.volume = v ? 0 : this._bgmVolume;
    }
  }

  /** AI-readable state summary */
  $inspect(): string {
    const parts = ['AudioManager'];
    if (this._muted) parts.push('muted');
    if (this._bgmName) parts.push(`bgm="${this._bgmName}"`);
    parts.push(`sfx=${this._sfxVolume} bgm=${this._bgmVolume}`);
    parts.push(`${this._sounds.size} loaded`);
    return parts.join(' ');
  }

  /** Destroy all audio resources */
  destroy(): void {
    this.stopAllSfx();
    this.stopBgm();
    for (const h of this._sounds.values()) {
      h.destroy();
    }
    this._sounds.clear();
  }
}

// ── Factory ──

/**
 * Create an AudioManager with auto-detected platform.
 *
 * ```typescript
 * const audio = createAudio();
 * audio.load('hit', 'assets/hit.mp3');
 * audio.playSfx('hit');
 * ```
 */
export function createAudio(opts?: AudioManagerOptions): AudioManager {
  return new AudioManager(opts);
}

/** Create a mock AudioManager for testing (no real audio playback) */
export function createMockAudio(): AudioManager {
  return new AudioManager({ adapter: new MockAudioAdapter() });
}
