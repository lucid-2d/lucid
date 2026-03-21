import { describe, it, expect, vi } from 'vitest';
import { Sprite, SpriteSheet, AnimatedSprite } from '../src/sprite';

/** Mock image object (mimics what loadImage returns) */
function mockImage(w = 128, h = 128) {
  return { width: w, height: h, src: 'test.png' };
}

/** Stub ctx that records drawImage calls */
function stubCtx() {
  return {
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    globalAlpha: 1,
  } as any;
}

function renderSprite(sprite: Sprite) {
  const ctx = stubCtx();
  sprite.$render(ctx);
  return ctx;
}

describe('Sprite', () => {
  it('creates with image and dimensions', () => {
    const img = mockImage();
    const s = new Sprite({ image: img, width: 48, height: 48 });
    expect(s.width).toBe(48);
    expect(s.height).toBe(48);
    expect(s.image).toBe(img);
  });

  it('draws full image via ctx.drawImage', () => {
    const img = mockImage();
    const s = new Sprite({ image: img, width: 48, height: 48 });
    const ctx = renderSprite(s);

    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 48, 48);
  });

  it('draws with sourceRect (sprite sheet cropping)', () => {
    const img = mockImage(256, 256);
    const s = new Sprite({
      image: img,
      sourceRect: { x: 64, y: 0, w: 64, h: 64 },
      width: 32, height: 32,
    });
    const ctx = renderSprite(s);

    // 9-arg drawImage: source rect + dest rect
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 64, 0, 64, 64, 0, 0, 32, 32);
  });

  it('does not draw if image is null', () => {
    const s = new Sprite({ image: null, width: 48, height: 48 });
    const ctx = renderSprite(s);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('does not draw if size is 0', () => {
    const s = new Sprite({ image: mockImage(), width: 0, height: 48 });
    const ctx = renderSprite(s);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('$text shows source info', () => {
    const s1 = new Sprite({ image: mockImage(), width: 48, height: 48 });
    expect(s1.$text).toBe('image');

    const s2 = new Sprite({
      image: mockImage(),
      sourceRect: { x: 10, y: 20, w: 64, h: 32 },
      width: 48, height: 24,
    });
    expect(s2.$text).toBe('src=64x32@(10,20)');
  });

  it('$inspect includes sprite info', () => {
    const s = new Sprite({
      id: 'player',
      image: mockImage(),
      sourceRect: { x: 0, y: 0, w: 64, h: 64 },
      width: 48, height: 48,
    });
    const out = s.$inspect();
    expect(out).toContain('Sprite#player');
    expect(out).toContain('src=64x64@(0,0)');
  });

  it('supports flipX', () => {
    const img = mockImage();
    const s = new Sprite({ image: img, width: 48, height: 48, flipX: true });
    const ctx = renderSprite(s);

    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('supports flipY', () => {
    const img = mockImage();
    const s = new Sprite({ image: img, width: 48, height: 48, flipY: true });
    const ctx = renderSprite(s);

    expect(ctx.scale).toHaveBeenCalledWith(1, -1);
    expect(ctx.drawImage).toHaveBeenCalled();
  });
});

describe('SpriteSheet', () => {
  it('stores and retrieves regions', () => {
    const img = mockImage(256, 128);
    const sheet = new SpriteSheet(img, {
      idle: { x: 0, y: 0, w: 64, h: 64 },
      walk: { x: 64, y: 0, w: 64, h: 64 },
    });

    expect(sheet.getRegion('idle')).toEqual({ x: 0, y: 0, w: 64, h: 64 });
    expect(sheet.getRegion('walk')).toEqual({ x: 64, y: 0, w: 64, h: 64 });
    expect(sheet.getRegion('missing')).toBeUndefined();
    expect(sheet.regionNames).toEqual(['idle', 'walk']);
  });

  it('createSprite returns correctly configured Sprite', () => {
    const img = mockImage(256, 128);
    const sheet = new SpriteSheet(img, {
      idle: { x: 0, y: 0, w: 64, h: 64 },
    });

    const sprite = sheet.createSprite('idle', { width: 32, height: 32 });
    expect(sprite).toBeInstanceOf(Sprite);
    expect(sprite.width).toBe(32);
    expect(sprite.height).toBe(32);
    expect(sprite.sourceRect).toEqual({ x: 0, y: 0, w: 64, h: 64 });
    expect(sprite.image).toBe(img);
    expect(sprite.id).toBe('idle');
  });

  it('createSprite uses region size as default', () => {
    const img = mockImage();
    const sheet = new SpriteSheet(img, {
      big: { x: 0, y: 0, w: 128, h: 96 },
    });

    const sprite = sheet.createSprite('big');
    expect(sprite.width).toBe(128);
    expect(sprite.height).toBe(96);
  });

  it('createSprite throws for unknown region', () => {
    const sheet = new SpriteSheet(mockImage(), {});
    expect(() => sheet.createSprite('nope')).toThrow('Unknown sprite region: nope');
  });

  it('fromGrid creates regions automatically', () => {
    const img = mockImage(192, 128);
    const sheet = SpriteSheet.fromGrid(img, 3, 2, 64, 64, ['a', 'b', 'c', 'd', 'e', 'f']);

    expect(sheet.getRegion('a')).toEqual({ x: 0, y: 0, w: 64, h: 64 });
    expect(sheet.getRegion('c')).toEqual({ x: 128, y: 0, w: 64, h: 64 });
    expect(sheet.getRegion('d')).toEqual({ x: 0, y: 64, w: 64, h: 64 });
    expect(sheet.getRegion('f')).toEqual({ x: 128, y: 64, w: 64, h: 64 });
    expect(sheet.regionNames).toHaveLength(6);
  });

  it('fromGrid uses default names when none provided', () => {
    const sheet = SpriteSheet.fromGrid(mockImage(), 2, 2, 32, 32);
    expect(sheet.regionNames).toEqual(['0_0', '0_1', '1_0', '1_1']);
  });

  it('createAnimated creates AnimatedSprite from frame names', () => {
    const img = mockImage(192, 64);
    const sheet = SpriteSheet.fromGrid(img, 3, 1, 64, 64, ['f1', 'f2', 'f3']);
    const anim = sheet.createAnimated(['f1', 'f2', 'f3'], { fps: 24 });
    expect(anim).toBeInstanceOf(AnimatedSprite);
    expect(anim.frameCount).toBe(3);
    expect(anim.fps).toBe(24);
    expect(anim.width).toBe(64);
    expect(anim.height).toBe(64);
  });
});

// ── AnimatedSprite ──

describe('AnimatedSprite', () => {
  function makeFrames(count: number) {
    return Array.from({ length: count }, (_, i) => ({ image: mockImage(), sourceRect: { x: i * 32, y: 0, w: 32, h: 32 } }));
  }

  it('creates with frame array', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(4), width: 32, height: 32 });
    expect(anim.frameCount).toBe(4);
    expect(anim.frameIndex).toBe(0);
    expect(anim.playing).toBe(true);
  });

  it('accepts raw images (auto-wraps to FrameDef)', () => {
    const images = [mockImage(), mockImage(), mockImage()];
    const anim = AnimatedSprite.fromImages(images, { width: 32, height: 32 });
    expect(anim.frameCount).toBe(3);
  });

  it('advances frames on $update at correct fps', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(4), fps: 10, width: 32, height: 32 });
    expect(anim.frameIndex).toBe(0);

    anim.$update(0.1); // 100ms = 1 frame at 10fps
    expect(anim.frameIndex).toBe(1);

    anim.$update(0.1);
    expect(anim.frameIndex).toBe(2);
  });

  it('loop mode wraps around', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(3), fps: 10, mode: 'loop', width: 32, height: 32 });
    anim.$update(0.1); // → frame 1
    anim.$update(0.1); // → frame 2
    anim.$update(0.1); // → frame 0 (wrap)
    expect(anim.frameIndex).toBe(0);
  });

  it('once mode stops at last frame and emits complete', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(3), fps: 10, mode: 'once', width: 32, height: 32 });
    const handler = vi.fn();
    anim.$on('complete', handler);

    anim.$update(0.1); // → 1
    anim.$update(0.1); // → 2 (last frame reached, still playing to display it)
    expect(anim.frameIndex).toBe(2);
    expect(anim.playing).toBe(true);

    anim.$update(0.1); // → tries to advance past last, triggers complete
    expect(anim.frameIndex).toBe(2);
    expect(anim.playing).toBe(false);
    expect(anim.finished).toBe(true);
    expect(handler).toHaveBeenCalledOnce();

    // Further updates don't change frame
    anim.$update(0.1);
    expect(anim.frameIndex).toBe(2);
  });

  it('pingpong mode bounces', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(4), fps: 10, mode: 'pingpong', width: 32, height: 32 });
    // 0 → 1 → 2 → 3 → 2 → 1 → 0 → 1
    anim.$update(0.1); expect(anim.frameIndex).toBe(1);
    anim.$update(0.1); expect(anim.frameIndex).toBe(2);
    anim.$update(0.1); expect(anim.frameIndex).toBe(3);
    anim.$update(0.1); expect(anim.frameIndex).toBe(2); // bounce
    anim.$update(0.1); expect(anim.frameIndex).toBe(1);
    anim.$update(0.1); expect(anim.frameIndex).toBe(0);
    anim.$update(0.1); expect(anim.frameIndex).toBe(1); // forward again
  });

  it('pause/play/stop controls', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(4), fps: 10, width: 32, height: 32 });
    anim.$update(0.1); // → 1
    anim.pause();
    expect(anim.playing).toBe(false);

    anim.$update(0.1); // paused, no change
    expect(anim.frameIndex).toBe(1);

    anim.play();
    anim.$update(0.1); // → 2
    expect(anim.frameIndex).toBe(2);

    anim.stop();
    expect(anim.frameIndex).toBe(0);
    expect(anim.playing).toBe(false);
  });

  it('restart resets and plays', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(4), fps: 10, mode: 'once', width: 32, height: 32 });
    anim.$update(0.5); // play through
    expect(anim.finished).toBe(true);

    anim.restart();
    expect(anim.frameIndex).toBe(0);
    expect(anim.playing).toBe(true);
    expect(anim.finished).toBe(false);
  });

  it('draws current frame', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(3), width: 32, height: 32 });
    const ctx = stubCtx();
    anim['draw'](ctx);
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    // Should use sourceRect
    expect(ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(), 0, 0, 32, 32, 0, 0, 32, 32
    );
  });

  it('$text shows frame info', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(5), width: 32, height: 32 });
    expect(anim.$text).toBe('frame=1/5');
    anim.$update(0.1);
    expect(anim.$text).toBe('frame=2/5');
  });

  it('$inspectInfo shows state and fps', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(3), fps: 24, width: 32, height: 32 });
    expect(anim['$inspectInfo']()).toBe('playing 24fps');
    anim.pause();
    expect(anim['$inspectInfo']()).toBe('paused 24fps');
  });

  it('flipX/flipY work', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(2), width: 32, height: 32, flipX: true });
    const ctx = stubCtx();
    anim['draw'](ctx);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
  });

  it('autoPlay: false starts paused', () => {
    const anim = new AnimatedSprite({ frames: makeFrames(3), autoPlay: false, width: 32, height: 32 });
    expect(anim.playing).toBe(false);
  });
});
