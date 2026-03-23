import { describe, it, expect, vi } from 'vitest';
import { createPreferences } from '../src/preferences';
import { MemoryStorage } from '../src/storage';

describe('Preferences', () => {
  it('returns default values on first use', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { sfxMuted: false, bgmMuted: false, language: 'zh' },
    });

    expect(prefs.get('sfxMuted')).toBe(false);
    expect(prefs.get('language')).toBe('zh');
  });

  it('set persists and get returns new value', () => {
    const storage = new MemoryStorage();
    const prefs = createPreferences({
      storage,
      defaults: { sfxMuted: false },
    });

    prefs.set('sfxMuted', true);
    expect(prefs.get('sfxMuted')).toBe(true);

    // Verify persisted in storage
    expect(storage.get('prefs:sfxMuted')).toBe(true);
  });

  it('loads persisted values on creation', () => {
    const storage = new MemoryStorage();
    storage.set('prefs:sfxMuted', true);
    storage.set('prefs:language', 'en');

    const prefs = createPreferences({
      storage,
      defaults: { sfxMuted: false, language: 'zh' },
    });

    expect(prefs.get('sfxMuted')).toBe(true);
    expect(prefs.get('language')).toBe('en');
  });

  it('onChange fires when value changes', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { volume: 1 },
    });

    const handler = vi.fn();
    prefs.onChange('volume', handler);
    prefs.set('volume', 0.5);

    expect(handler).toHaveBeenCalledWith(0.5, 'volume');
  });

  it('onChange does not fire when value is the same', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { muted: false },
    });

    const handler = vi.fn();
    prefs.onChange('muted', handler);
    prefs.set('muted', false); // same as default

    expect(handler).not.toHaveBeenCalled();
  });

  it('offChange removes listener', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { x: 0 },
    });

    const handler = vi.fn();
    prefs.onChange('x', handler);
    prefs.offChange('x', handler);
    prefs.set('x', 1);

    expect(handler).not.toHaveBeenCalled();
  });

  it('reset restores default', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { sfxMuted: false },
    });

    prefs.set('sfxMuted', true);
    expect(prefs.get('sfxMuted')).toBe(true);

    prefs.reset('sfxMuted');
    expect(prefs.get('sfxMuted')).toBe(false);
  });

  it('resetAll restores all defaults', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { a: 1, b: 'x' },
    });

    prefs.set('a', 99);
    prefs.set('b', 'y');
    prefs.resetAll();

    expect(prefs.get('a')).toBe(1);
    expect(prefs.get('b')).toBe('x');
  });

  it('getAll returns merged values', () => {
    const prefs = createPreferences({
      storage: new MemoryStorage(),
      defaults: { a: 1, b: 2, c: 3 },
    });

    prefs.set('b', 20);

    expect(prefs.getAll()).toEqual({ a: 1, b: 20, c: 3 });
  });

  it('custom prefix', () => {
    const storage = new MemoryStorage();
    const prefs = createPreferences({
      storage,
      defaults: { x: 0 },
      prefix: 'game:',
    });

    prefs.set('x', 42);
    expect(storage.get('game:x')).toBe(42);
  });
});
