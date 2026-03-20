import { describe, it, expect, vi } from 'vitest';
import { MiniGameStorage } from '../src/storage';

function createMockWxApi() {
  const store = new Map<string, string>();
  return {
    setStorageSync: vi.fn((k: string, v: string) => store.set(k, v)),
    getStorageSync: vi.fn((k: string) => store.get(k) ?? ''),
    removeStorageSync: vi.fn((k: string) => store.delete(k)),
    getStorageInfoSync: vi.fn(() => ({ keys: [...store.keys()] })),
  };
}

describe('MiniGameStorage', () => {
  it('set and get', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api);
    s.set('score', 100);
    expect(s.get('score')).toBe(100);
  });

  it('get returns default for missing', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api);
    expect(s.get('missing', 42)).toBe(42);
  });

  it('has works', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api);
    expect(s.has('x')).toBe(false);
    s.set('x', 1);
    expect(s.has('x')).toBe(true);
  });

  it('remove works', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api);
    s.set('k', 'v');
    s.remove('k');
    expect(s.has('k')).toBe(false);
  });

  it('keys returns prefixed keys only', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api, 'game:');
    s.set('a', 1);
    s.set('b', 2);
    // 手动加个非前缀的
    api.setStorageSync('other', 'x');
    expect(s.keys().sort()).toEqual(['a', 'b']);
  });

  it('clear removes only prefixed keys', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api, 'game:');
    s.set('a', 1);
    api.setStorageSync('other', 'x');
    s.clear();
    expect(s.has('a')).toBe(false);
    expect(api.getStorageSync('other')).toBe('x');
  });

  it('stores objects via JSON', () => {
    const api = createMockWxApi();
    const s = new MiniGameStorage(api);
    s.set('player', { name: 'test', lv: 5 });
    expect(s.get('player')).toEqual({ name: 'test', lv: 5 });
  });
});
