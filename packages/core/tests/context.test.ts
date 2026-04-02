import { describe, it, expect } from 'vitest';
import { UINode } from '../src/node';

describe('$context()', () => {
  it('returns structured context for a node', () => {
    const root = new UINode({ id: 'root', width: 390, height: 844 });
    const btn = new UINode({ id: 'play', width: 200, height: 50, x: 95, y: 400 });
    btn.interactive = true;
    root.addChild(btn);

    const ctx = btn.$context();
    expect(ctx.id).toBe('play');
    expect(ctx.type).toBe('UINode');
    expect(ctx.position).toEqual({ x: 95, y: 400 });
    expect(ctx.size).toEqual({ width: 200, height: 50 });
    expect(ctx.interactive).toBe(true);
    expect(ctx.visible).toBe(true);
    expect(ctx.disabled).toBe(false);
    expect(ctx.parent).toBe('root');
    expect(ctx.path).toBe('root > play');
  });

  it('lists siblings', () => {
    const parent = new UINode({ id: 'panel', width: 300, height: 300 });
    const a = new UINode({ id: 'a', width: 50, height: 50 });
    const b = new UINode({ id: 'b', width: 50, height: 50 });
    const c = new UINode({ id: 'c', width: 50, height: 50 });
    parent.addChild(a);
    parent.addChild(b);
    parent.addChild(c);

    const ctx = b.$context();
    expect(ctx.siblings).toEqual(['a', 'c']);
  });

  it('handles root node (no parent)', () => {
    const root = new UINode({ id: 'root', width: 390, height: 844 });
    const ctx = root.$context();
    expect(ctx.parent).toBeNull();
    expect(ctx.siblings).toEqual([]);
  });

  it('includes text when available', () => {
    const node = new UINode({ id: 'label', width: 100, height: 30 });
    // UINode.$text returns undefined by default
    const ctx = node.$context();
    expect(ctx.text).toBeUndefined();
  });

  it('includes inspectInfo when subclass provides it', () => {
    class CustomNode extends UINode {
      $inspectInfo() { return 'variant=primary'; }
    }
    const node = new CustomNode({ id: 'btn', width: 100, height: 40 });
    const ctx = node.$context();
    expect(ctx.inspectInfo).toBe('variant=primary');
  });

  it('uses $type for unnamed siblings', () => {
    const parent = new UINode({ id: 'panel', width: 300, height: 300 });
    const named = new UINode({ id: 'named', width: 50, height: 50 });
    const unnamed = new UINode({ width: 50, height: 50 }); // no id
    parent.addChild(named);
    parent.addChild(unnamed);

    const ctx = named.$context();
    expect(ctx.siblings).toEqual(['UINode']);
  });
});
