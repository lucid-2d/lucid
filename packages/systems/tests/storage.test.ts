import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage, createStorage, type Storage } from '../src/storage';

describe('MemoryStorage', () => {
  let store: Storage;

  beforeEach(() => {
    store = new MemoryStorage();
  });

  it('get returns undefined for missing key', () => {
    expect(store.get('missing')).toBeUndefined();
  });

  it('get returns default for missing key', () => {
    expect(store.get('missing', 42)).toBe(42);
  });

  it('set and get', () => {
    store.set('score', 100);
    expect(store.get('score')).toBe(100);
  });

  it('stores objects', () => {
    store.set('player', { name: 'test', level: 5 });
    expect(store.get('player')).toEqual({ name: 'test', level: 5 });
  });

  it('remove deletes key', () => {
    store.set('key', 'value');
    store.remove('key');
    expect(store.get('key')).toBeUndefined();
  });

  it('has returns correct boolean', () => {
    expect(store.has('key')).toBe(false);
    store.set('key', 1);
    expect(store.has('key')).toBe(true);
  });

  it('clear removes all keys', () => {
    store.set('a', 1);
    store.set('b', 2);
    store.clear();
    expect(store.has('a')).toBe(false);
    expect(store.has('b')).toBe(false);
  });

  it('keys returns all keys', () => {
    store.set('x', 1);
    store.set('y', 2);
    expect(store.keys().sort()).toEqual(['x', 'y']);
  });
});

describe('createStorage', () => {
  it('creates MemoryStorage by default in non-browser env', () => {
    const store = createStorage();
    store.set('test', 123);
    expect(store.get('test')).toBe(123);
  });
});
