import { describe, it, expect, vi } from 'vitest';
import { ScrollView } from '../src/scroll-view';
import { UINode } from '@lucid-2d/core';

describe('ScrollView basics', () => {
  it('starts at scrollY 0', () => {
    const sv = new ScrollView({ width: 300, height: 400 });
    expect(sv.scrollY).toBe(0);
  });

  it('clamps scrollY to 0', () => {
    const sv = new ScrollView({ width: 300, height: 400 });
    sv.contentHeight = 1000;
    sv.scrollTo(-100);
    expect(sv.scrollY).toBe(0);
  });

  it('clamps scrollY to max', () => {
    const sv = new ScrollView({ width: 300, height: 400 });
    sv.contentHeight = 1000;
    sv.scrollTo(9999);
    expect(sv.scrollY).toBe(600); // 1000 - 400
  });

  it('max scroll is 0 when content fits', () => {
    const sv = new ScrollView({ width: 300, height: 400 });
    sv.contentHeight = 200;
    sv.scrollTo(100);
    expect(sv.scrollY).toBe(0);
  });

  it('content is a child node for addChild', () => {
    const sv = new ScrollView({ width: 300, height: 400 });
    const item = new UINode({ id: 'item' });
    sv.content.addChild(item);
    expect(sv.findById('item')).toBe(item);
  });

  it('$inspect shows scroll position', () => {
    const sv = new ScrollView({ id: 'list', width: 300, height: 400 });
    sv.contentHeight = 1000;
    sv.scrollTo(120);
    const out = sv.$inspect(0);
    expect(out).toContain('scroll=120/600');
  });
});

// ── 交互测试 ──

describe('ScrollView hitTest', () => {
  it('always captures touch within bounds', () => {
    const sv = new ScrollView({ id: 'sv', x: 10, y: 10, width: 200, height: 300 });
    const btn = new UINode({ id: 'btn', x: 20, y: 20, width: 80, height: 40, interactive: true });
    sv.content.addChild(btn);

    // hitTest inside ScrollView → returns ScrollView, NOT btn
    const hit = sv.hitTest(40, 40);
    expect(hit?.id).toBe('sv');
  });

  it('returns null outside bounds', () => {
    const sv = new ScrollView({ id: 'sv', x: 10, y: 10, width: 200, height: 300 });
    expect(sv.hitTest(5, 5)).toBeNull();
    expect(sv.hitTest(250, 150)).toBeNull();
  });
});

describe('ScrollView scroll gesture', () => {
  function createSV() {
    const sv = new ScrollView({ id: 'sv', width: 300, height: 400, scrollThreshold: 5 });
    sv.contentHeight = 1000;
    return sv;
  }

  it('touchmove > threshold triggers scroll', () => {
    const sv = createSV();

    sv.$emit('touchstart', { localX: 150, localY: 200, worldX: 150, worldY: 200 });
    // Move 10px down → scroll up
    sv.$emit('touchmove', { localX: 150, localY: 190 });
    sv.$emit('touchend', { localX: 150, localY: 190, worldX: 150, worldY: 190 });

    expect(sv.scrollY).toBe(10); // scrolled 10px
  });

  it('touchmove < threshold does NOT scroll (treated as tap)', () => {
    const sv = createSV();

    sv.$emit('touchstart', { localX: 150, localY: 200, worldX: 150, worldY: 200 });
    // Move only 3px (below 5px threshold)
    sv.$emit('touchmove', { localX: 150, localY: 197 });
    sv.$emit('touchend', { localX: 150, localY: 197, worldX: 150, worldY: 197 });

    expect(sv.scrollY).toBe(0); // not scrolled
  });

  it('continuous scroll updates scrollY', () => {
    const sv = createSV();

    sv.$emit('touchstart', { localX: 150, localY: 300, worldX: 150, worldY: 300 });
    sv.$emit('touchmove', { localX: 150, localY: 250 }); // -50
    sv.$emit('touchmove', { localX: 150, localY: 200 }); // total -100
    sv.$emit('touchend', { localX: 150, localY: 200, worldX: 150, worldY: 200 });

    expect(sv.scrollY).toBe(100);
  });
});

describe('ScrollView tap forwarding', () => {
  it('tap (no scroll) forwards to interactive child', () => {
    const sv = new ScrollView({ id: 'sv', width: 300, height: 400 });
    sv.contentHeight = 1000;

    const btn = new UINode({ id: 'btn', x: 50, y: 50, width: 100, height: 40, interactive: true });
    let tapped = false;
    btn.$on('touchend', () => { tapped = true; });
    sv.content.addChild(btn);

    // Tap at (100, 70) — inside btn (50+50=100 x, 50+20=70 y)
    sv.$emit('touchstart', { localX: 100, localY: 70, worldX: 100, worldY: 70 });
    sv.$emit('touchend', { localX: 100, localY: 70, worldX: 100, worldY: 70 });

    expect(tapped).toBe(true);
  });

  it('scroll gesture does NOT forward tap to child', () => {
    const sv = new ScrollView({ id: 'sv', width: 300, height: 400 });
    sv.contentHeight = 1000;

    const btn = new UINode({ id: 'btn', x: 50, y: 50, width: 100, height: 40, interactive: true });
    let tapped = false;
    btn.$on('touchend', () => { tapped = true; });
    sv.content.addChild(btn);

    // Drag over btn area — should scroll, not tap
    sv.$emit('touchstart', { localX: 100, localY: 70, worldX: 100, worldY: 70 });
    sv.$emit('touchmove', { localX: 100, localY: 40 }); // 30px movement
    sv.$emit('touchend', { localX: 100, localY: 40, worldX: 100, worldY: 40 });

    expect(tapped).toBe(false);
    expect(sv.scrollY).toBe(30);
  });

  it('tap on empty area (no interactive child) does nothing', () => {
    const sv = new ScrollView({ id: 'sv', width: 300, height: 400 });
    sv.contentHeight = 1000;

    // Tap on empty area — no error
    sv.$emit('touchstart', { localX: 100, localY: 200, worldX: 100, worldY: 200 });
    sv.$emit('touchend', { localX: 100, localY: 200, worldX: 100, worldY: 200 });
    // No crash, no scroll
    expect(sv.scrollY).toBe(0);
  });

  it('tap forwarding works after scrolling', () => {
    const sv = new ScrollView({ id: 'sv', width: 300, height: 400 });
    sv.contentHeight = 1000;

    const btn = new UINode({ id: 'btn', x: 50, y: 500, width: 100, height: 40, interactive: true });
    let tapped = false;
    btn.$on('touchend', () => { tapped = true; });
    sv.content.addChild(btn);

    // Scroll down first
    sv.scrollTo(200);

    // btn is at y=500 in content, scrollY=200, so visible at y=300 in viewport
    // Tap at viewport y=300 → content y = 300 + scrollY offset handled by _forwardTap
    sv.$emit('touchstart', { localX: 100, localY: 300, worldX: 100, worldY: 300 });
    sv.$emit('touchend', { localX: 100, localY: 300, worldX: 100, worldY: 300 });

    expect(tapped).toBe(true);
  });
});
