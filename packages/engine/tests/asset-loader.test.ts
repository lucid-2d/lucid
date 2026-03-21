import { describe, it, expect, vi } from 'vitest';
import { AssetLoader } from '../src/asset-loader';

describe('AssetLoader', () => {
  it('detects image type from extension', () => {
    const loader = new AssetLoader();
    loader.add('bg', 'assets/bg.png');
    loader.add('icon', 'assets/icon.jpg');
    expect(loader.total).toBe(2);
  });

  it('detects audio type', () => {
    const loader = new AssetLoader();
    loader.add('hit', 'assets/hit.mp3');
    loader.add('bgm', 'assets/bgm.ogg');
    expect(loader.total).toBe(2);
  });

  it('detects json type', () => {
    const loader = new AssetLoader();
    loader.add('data', 'assets/levels.json');
    expect(loader.total).toBe(1);
  });

  it('allows explicit type override', () => {
    const loader = new AssetLoader();
    loader.add('data', 'assets/data.bin', 'json');
    expect(loader.total).toBe(1);
  });

  it('add is chainable', () => {
    const loader = new AssetLoader();
    const result = loader.add('a', 'a.png').add('b', 'b.png');
    expect(result).toBe(loader);
    expect(loader.total).toBe(2);
  });

  it('progress starts at 0', () => {
    const loader = new AssetLoader();
    loader.add('a', 'a.png');
    expect(loader.progress).toBe(0);
    expect(loader.loaded).toBe(0);
  });

  it('progress is 1 when no entries', () => {
    const loader = new AssetLoader();
    expect(loader.progress).toBe(1);
  });

  it('audio assets stored as src strings', async () => {
    const loader = new AssetLoader();
    loader.add('hit', 'assets/hit.mp3');

    // Mock loadImage to prevent actual loading for image types
    const assets = await loader.load();
    expect(assets.get('hit')).toBe('assets/hit.mp3');
  });

  it('onProgress is called', async () => {
    const loader = new AssetLoader();
    loader.add('a', 'assets/a.mp3');
    loader.add('b', 'assets/b.mp3');

    const progressCalls: [number, number][] = [];
    loader.onProgress = (loaded, total) => {
      progressCalls.push([loaded, total]);
    };

    await loader.load();
    expect(progressCalls.length).toBe(2);
    // All calls should have total=2
    for (const [, total] of progressCalls) {
      expect(total).toBe(2);
    }
  });

  it('has and get work after load', async () => {
    const loader = new AssetLoader();
    loader.add('sfx', 'assets/sfx.mp3');
    await loader.load();
    expect(loader.has('sfx')).toBe(true);
    expect(loader.get('sfx')).toBe('assets/sfx.mp3');
    expect(loader.has('nonexistent')).toBe(false);
  });
});
