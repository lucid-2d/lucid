import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadImage } from '../src/image-loader';

describe('loadImage', () => {
  let origImage: any;

  beforeEach(() => {
    origImage = (globalThis as any).Image;
  });

  afterEach(() => {
    if (origImage !== undefined) {
      (globalThis as any).Image = origImage;
    } else {
      delete (globalThis as any).Image;
    }
  });

  it('resolves with image on load (web)', async () => {
    let onloadCb: any;
    const mockImg = { src: '', onload: null as any, onerror: null as any };

    (globalThis as any).Image = vi.fn(() => {
      return new Proxy(mockImg, {
        set(target: any, prop, value) {
          target[prop] = value;
          if (prop === 'src') {
            // Simulate async load
            setTimeout(() => target.onload?.(), 0);
          }
          return true;
        },
      });
    });

    const img = await loadImage('test.png');
    expect(img.src).toBe('test.png');
  });

  it('rejects on error', async () => {
    (globalThis as any).Image = vi.fn(() => {
      const obj: any = { src: '', onload: null, onerror: null };
      return new Proxy(obj, {
        set(target, prop, value) {
          target[prop] = value;
          if (prop === 'src') {
            setTimeout(() => target.onerror?.(new Error('fail')), 0);
          }
          return true;
        },
      });
    });

    await expect(loadImage('bad.png')).rejects.toThrow('Failed to load');
  });

  it('rejects on timeout', async () => {
    (globalThis as any).Image = vi.fn(() => {
      return { src: '', onload: null, onerror: null };
    });

    // Very short timeout
    await expect(loadImage('slow.png', 10)).rejects.toThrow('Timeout');
  });

  it('uses wx.createImage when available', async () => {
    const origWx = (globalThis as any).wx;
    const mockImg: any = { src: '', onload: null, onerror: null };

    (globalThis as any).wx = {
      createImage: vi.fn(() => {
        return new Proxy(mockImg, {
          set(target, prop, value) {
            target[prop] = value;
            if (prop === 'src') setTimeout(() => target.onload?.(), 0);
            return true;
          },
        });
      }),
    };
    // Remove Image to ensure wx path is used
    delete (globalThis as any).Image;

    const img = await loadImage('wx-test.png');
    expect((globalThis as any).wx.createImage).toHaveBeenCalled();
    expect(img.src).toBe('wx-test.png');

    if (origWx !== undefined) (globalThis as any).wx = origWx;
    else delete (globalThis as any).wx;
  });
});
