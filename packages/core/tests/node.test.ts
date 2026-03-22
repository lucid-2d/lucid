/**
 * UINode 单元测试 — 树结构、生命周期、hitTest、脏标记
 */
import { describe, it, expect, vi } from 'vitest';
import { UINode } from '../src/node';

// ── 树结构 ──────────────────────────────────────

describe('UINode tree', () => {
  it('addChild sets parent and adds to children', () => {
    const parent = new UINode();
    const child = new UINode();
    parent.addChild(child);
    expect(child.$parent).toBe(parent);
    expect(parent.$children).toContain(child);
    expect(parent.$children).toHaveLength(1);
  });

  it('addChild at index inserts at position', () => {
    const parent = new UINode();
    const a = new UINode({ id: 'a' });
    const b = new UINode({ id: 'b' });
    const c = new UINode({ id: 'c' });
    parent.addChild(a).addChild(c);
    parent.addChild(b, 1);
    expect(parent.$children.map(n => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('addChild to new parent removes from old parent', () => {
    const p1 = new UINode();
    const p2 = new UINode();
    const child = new UINode();
    p1.addChild(child);
    p2.addChild(child);
    expect(p1.$children).toHaveLength(0);
    expect(p2.$children).toContain(child);
    expect(child.$parent).toBe(p2);
  });

  it('removeChild clears parent', () => {
    const parent = new UINode();
    const child = new UINode();
    parent.addChild(child);
    parent.removeChild(child);
    expect(child.$parent).toBeNull();
    expect(parent.$children).toHaveLength(0);
  });

  it('removeChild on non-child does nothing', () => {
    const parent = new UINode();
    const stranger = new UINode();
    expect(() => parent.removeChild(stranger)).not.toThrow();
  });

  it('removeFromParent removes self', () => {
    const parent = new UINode();
    const child = new UINode();
    parent.addChild(child);
    child.removeFromParent();
    expect(parent.$children).toHaveLength(0);
    expect(child.$parent).toBeNull();
  });

  it('removeFromParent when no parent does nothing', () => {
    const node = new UINode();
    expect(() => node.removeFromParent()).not.toThrow();
  });

  it('findById searches recursively', () => {
    const root = new UINode({ id: 'root' });
    const panel = new UINode({ id: 'panel' });
    const btn = new UINode({ id: 'buy-btn' });
    root.addChild(panel);
    panel.addChild(btn);
    expect(root.findById('buy-btn')).toBe(btn);
    expect(root.findById('panel')).toBe(panel);
    expect(root.findById('nope')).toBeNull();
  });

  it('findById returns self if id matches', () => {
    const node = new UINode({ id: 'me' });
    expect(node.findById('me')).toBe(node);
  });

  it('findByType returns all matching descendants', () => {
    class MyButton extends UINode {}
    class MyLabel extends UINode {}
    const root = new UINode();
    const b1 = new MyButton();
    const b2 = new MyButton();
    const label = new MyLabel();
    root.addChild(b1).addChild(label).addChild(b2);
    const found = root.findByType(MyButton);
    expect(found).toHaveLength(2);
    expect(found).toContain(b1);
    expect(found).toContain(b2);
  });
});

// ── 生命周期 ──────────────────────────────────────

describe('UINode lifecycle', () => {
  it('calls onMounted when added', () => {
    const child = new UINode();
    child.onMounted = vi.fn();
    const parent = new UINode();
    parent.addChild(child);
    expect(child.onMounted).toHaveBeenCalledOnce();
  });

  it('calls onUnmounted when removed', () => {
    const parent = new UINode();
    const child = new UINode();
    child.onUnmounted = vi.fn();
    parent.addChild(child);
    parent.removeChild(child);
    expect(child.onUnmounted).toHaveBeenCalledOnce();
  });

  it('calls onMounted recursively on subtree', () => {
    const root = new UINode();
    const panel = new UINode();
    const btn = new UINode();
    btn.onMounted = vi.fn();
    panel.addChild(btn);
    // btn mounted when added to panel
    expect(btn.onMounted).toHaveBeenCalledOnce();
    // adding panel to root triggers mount again for the subtree
    root.addChild(panel);
    expect(btn.onMounted).toHaveBeenCalledTimes(2);
  });
});

// ── hitTest ───────────────────────────────────────

describe('UINode hitTest', () => {
  it('constructor accepts interactive/visible/alpha', () => {
    const node = new UINode({ id: 'a', interactive: true, visible: false, alpha: 0.5 });
    expect(node.interactive).toBe(true);
    expect(node.visible).toBe(false);
    expect(node.alpha).toBe(0.5);
  });

  it('returns interactive node containing point', () => {
    const root = new UINode({ width: 400, height: 800 });
    const btn = new UINode({ id: 'btn', x: 100, y: 100, width: 80, height: 40, interactive: true });
    root.addChild(btn);
    expect(root.hitTest(120, 110)?.id).toBe('btn');
  });

  it('returns null for miss', () => {
    const root = new UINode({ width: 400, height: 800 });
    const btn = new UINode({ x: 100, y: 100, width: 80, height: 40 });
    btn.interactive = true;
    root.addChild(btn);
    expect(root.hitTest(0, 0)).toBeNull();
  });

  it('returns null for invisible nodes', () => {
    const root = new UINode({ width: 400, height: 800 });
    const btn = new UINode({ x: 0, y: 0, width: 100, height: 100 });
    btn.interactive = true;
    btn.visible = false;
    root.addChild(btn);
    expect(root.hitTest(50, 50)).toBeNull();
  });

  it('returns null for non-interactive nodes', () => {
    const root = new UINode({ width: 400, height: 800 });
    const bg = new UINode({ x: 0, y: 0, width: 400, height: 800 });
    bg.interactive = false;
    root.addChild(bg);
    expect(root.hitTest(50, 50)).toBeNull();
  });

  it('later children (higher z) are hit first', () => {
    const root = new UINode({ width: 400, height: 800 });
    const a = new UINode({ id: 'a', x: 0, y: 0, width: 100, height: 100 });
    const b = new UINode({ id: 'b', x: 0, y: 0, width: 100, height: 100 });
    a.interactive = true;
    b.interactive = true;
    root.addChild(a).addChild(b);
    expect(root.hitTest(50, 50)?.id).toBe('b');
  });

  it('accounts for parent offset in nested nodes', () => {
    const root = new UINode({ width: 400, height: 800 });
    const panel = new UINode({ x: 100, y: 200, width: 200, height: 400 });
    const btn = new UINode({ id: 'btn', x: 10, y: 10, width: 80, height: 40 });
    btn.interactive = true;
    root.addChild(panel);
    panel.addChild(btn);
    // btn world: x=110, y=210, w=80, h=40
    expect(root.hitTest(120, 220)?.id).toBe('btn');
    expect(root.hitTest(50, 50)).toBeNull();
  });

  it('worldToLocal converts coordinates through parent chain', () => {
    const root = new UINode({ width: 400, height: 800 });
    const panel = new UINode({ x: 100, y: 200, width: 200, height: 400 });
    const btn = new UINode({ id: 'btn', x: 10, y: 10, width: 80, height: 40 });
    root.addChild(panel);
    panel.addChild(btn);
    const local = btn.worldToLocal(120, 220);
    expect(local.x).toBeCloseTo(10);
    expect(local.y).toBeCloseTo(10);
  });
});

// ── 脏标记 ────────────────────────────────────────

describe('UINode dirty flag', () => {
  it('onLayout called on first render', () => {
    const onLayout = vi.fn();
    class TestNode extends UINode {
      protected onLayout() { onLayout(); }
    }
    const node = new TestNode();
    const ctx = createMockCtx();
    node.$render(ctx);
    expect(onLayout).toHaveBeenCalledOnce();
  });

  it('onLayout not called on second render if not dirty', () => {
    const onLayout = vi.fn();
    class TestNode extends UINode {
      protected onLayout() { onLayout(); }
    }
    const node = new TestNode();
    const ctx = createMockCtx();
    node.$render(ctx);
    node.$render(ctx);
    expect(onLayout).toHaveBeenCalledOnce();
  });

  it('markDirty causes onLayout on next render', () => {
    const onLayout = vi.fn();
    class TestNode extends UINode {
      protected onLayout() { onLayout(); }
      dirty() { this.markDirty(); }
    }
    const node = new TestNode();
    const ctx = createMockCtx();
    node.$render(ctx);  // 1st
    node.dirty();
    node.$render(ctx);  // 2nd — should call onLayout again
    expect(onLayout).toHaveBeenCalledTimes(2);
  });

  it('multiple markDirty only triggers one onLayout', () => {
    const onLayout = vi.fn();
    class TestNode extends UINode {
      protected onLayout() { onLayout(); }
      dirty() { this.markDirty(); }
    }
    const node = new TestNode();
    const ctx = createMockCtx();
    node.$render(ctx);       // 1st
    node.dirty();
    node.dirty();
    node.dirty();
    node.$render(ctx);       // 2nd
    expect(onLayout).toHaveBeenCalledTimes(2);
  });
});

// ── update 递归 ───────────────────────────────────

describe('UINode $update', () => {
  it('calls $update recursively on visible children', () => {
    const root = new UINode();
    const child = new UINode();
    const spy = vi.fn();
    child.onBeforeUpdate = spy;
    root.addChild(child);
    root.$update(0.016);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('skips invisible children', () => {
    const root = new UINode();
    const child = new UINode();
    child.visible = false;
    const spy = vi.fn();
    child.onBeforeUpdate = spy;
    root.addChild(child);
    root.$update(0.016);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── $patch ───────────────────────────────────────

describe('UINode $patch', () => {
  it('updates multiple properties at once', () => {
    const node = new UINode({ id: 'n', x: 0, y: 0, width: 100, height: 50 });
    node.$patch({ x: 50, y: 100, width: 200 });
    expect(node.x).toBe(50);
    expect(node.y).toBe(100);
    expect(node.width).toBe(200);
    expect(node.height).toBe(50); // unchanged
  });

  it('ignores properties not on the node', () => {
    const node = new UINode({ id: 'n' });
    node.$patch({ x: 10, nonExistent: 'hello' } as any);
    expect(node.x).toBe(10);
    expect((node as any).nonExistent).toBeUndefined();
  });

  it('returns this for chaining', () => {
    const node = new UINode();
    const result = node.$patch({ x: 1 });
    expect(result).toBe(node);
  });

  it('marks node dirty after patch', () => {
    const onLayout = vi.fn();
    class TestNode extends UINode {
      protected onLayout() { onLayout(); }
    }
    const node = new TestNode({ width: 100, height: 100 });
    const ctx = createMockCtx();
    node.$render(ctx); // clears initial dirty
    onLayout.mockClear();

    node.$patch({ x: 50 });
    node.$render(ctx);
    expect(onLayout).toHaveBeenCalledOnce();
  });

  it('works with visibility and alpha', () => {
    const node = new UINode();
    node.$patch({ visible: false, alpha: 0.5 });
    expect(node.visible).toBe(false);
    expect(node.alpha).toBe(0.5);
  });
});

// ── $query ───────────────────────────────────────

describe('UINode $query', () => {
  // Build a test tree
  class MenuScene extends UINode {}
  class GameScene extends UINode {}
  class ButtonNode extends UINode {}

  function buildTree() {
    const root = new UINode({ id: 'root', width: 390, height: 844 });
    const menu = new MenuScene({ id: 'menu' });
    const btn1 = new ButtonNode({ id: 'play' });
    btn1.interactive = true;
    const btn2 = new ButtonNode({ id: 'settings' });
    btn2.interactive = true;
    const label = new UINode({ id: 'title' });
    menu.addChild(label);
    menu.addChild(btn1);
    menu.addChild(btn2);
    root.addChild(menu);

    const game = new GameScene({ id: 'game' });
    game.visible = false;
    const btn3 = new ButtonNode({ id: 'pause' });
    btn3.interactive = true;
    game.addChild(btn3);
    root.addChild(game);

    return root;
  }

  it('query by class name', () => {
    const root = buildTree();
    const buttons = root.$query('ButtonNode');
    expect(buttons.map(n => n.id)).toEqual(['play', 'settings', 'pause']);
  });

  it('query by id', () => {
    const root = buildTree();
    const result = root.$query('#play');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('play');
  });

  it('query by .interactive', () => {
    const root = buildTree();
    const interactive = root.$query('.interactive');
    expect(interactive.map(n => n.id)).toEqual(['play', 'settings', 'pause']);
  });

  it('query by .hidden', () => {
    const root = buildTree();
    const hidden = root.$query('.hidden');
    expect(hidden).toHaveLength(1);
    expect(hidden[0].id).toBe('game');
  });

  it('descendant selector', () => {
    const root = buildTree();
    const menuButtons = root.$query('MenuScene ButtonNode');
    expect(menuButtons.map(n => n.id)).toEqual(['play', 'settings']);
  });

  it('returns empty for no match', () => {
    const root = buildTree();
    expect(root.$query('NonExistent')).toHaveLength(0);
    expect(root.$query('#nope')).toHaveLength(0);
  });

  it('multi-level descendant', () => {
    const root = buildTree();
    // root > GameScene > ButtonNode
    const result = root.$query('GameScene ButtonNode');
    expect(result.map(n => n.id)).toEqual(['pause']);
  });
});

// ── $snapshot / $diff ────────────────────────────

describe('UINode $snapshot / $diff', () => {
  it('$snapshot captures node state', () => {
    const node = new UINode({ id: 'btn', x: 10, y: 20, width: 100, height: 50 });
    node.interactive = true;
    const snap = node.$snapshot();
    expect(snap.type).toBe('UINode');
    expect(snap.id).toBe('btn');
    expect(snap.x).toBe(10);
    expect(snap.y).toBe(20);
    expect(snap.width).toBe(100);
    expect(snap.height).toBe(50);
    expect(snap.interactive).toBe(true);
    expect(snap.visible).toBe(true);
  });

  it('$snapshot captures children', () => {
    const parent = new UINode({ id: 'p' });
    parent.addChild(new UINode({ id: 'a' }));
    parent.addChild(new UINode({ id: 'b' }));
    const snap = parent.$snapshot();
    expect(snap.children).toHaveLength(2);
    expect(snap.children![0].id).toBe('a');
    expect(snap.children![1].id).toBe('b');
  });

  it('$snapshot captures $text and $inspectInfo', () => {
    class LabelNode extends UINode {
      get $text() { return 'hello'; }
      protected $inspectInfo() { return 'score=5'; }
    }
    const node = new LabelNode({ id: 'lbl' });
    const snap = node.$snapshot();
    expect(snap.text).toBe('hello');
    expect(snap.info).toBe('score=5');
  });

  it('$diff detects property changes', () => {
    const node = new UINode({ id: 'n', x: 0, y: 0, width: 100, height: 50 });
    const before = node.$snapshot();

    node.$patch({ x: 50, width: 200 });
    const after = node.$snapshot();

    const changes = UINode.$diff(before, after);
    expect(changes).toHaveLength(2);
    expect(changes).toContainEqual({ path: 'n', prop: 'x', from: 0, to: 50 });
    expect(changes).toContainEqual({ path: 'n', prop: 'width', from: 100, to: 200 });
  });

  it('$diff returns empty for identical snapshots', () => {
    const node = new UINode({ id: 'n', x: 10 });
    const snap = node.$snapshot();
    expect(UINode.$diff(snap, snap)).toHaveLength(0);
  });

  it('$diff detects nested changes', () => {
    const root = new UINode({ id: 'root' });
    const child = new UINode({ id: 'child', x: 0 });
    root.addChild(child);

    const before = root.$snapshot();
    child.x = 99;
    const after = root.$snapshot();

    const changes = UINode.$diff(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ path: 'root > child', prop: 'x', from: 0, to: 99 });
  });

  it('$diff detects added/removed children', () => {
    const root = new UINode({ id: 'root' });
    root.addChild(new UINode({ id: 'a' }));
    const before = root.$snapshot();

    root.addChild(new UINode({ id: 'b' }));
    const after = root.$snapshot();

    const changes = UINode.$diff(before, after);
    const addChange = changes.find(c => c.prop === 'children');
    expect(addChange).toBeDefined();
    expect(addChange!.to).toContain('+');
  });
});

// ── helpers ───────────────────────────────────────

function createMockCtx(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}
