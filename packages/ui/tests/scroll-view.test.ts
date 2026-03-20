import { describe, it, expect } from 'vitest';
import { ScrollView } from '../src/scroll-view';
import { UINode } from '@lucid/core';

describe('ScrollView', () => {
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
