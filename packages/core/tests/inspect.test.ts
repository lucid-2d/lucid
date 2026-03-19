/**
 * $inspect() + 交互录制器 测试
 */
import { describe, it, expect, vi } from 'vitest';
import { UINode } from '../src/node';

// ── $inspect ──────────────────────────────────────

describe('$inspect', () => {
  it('outputs single node with id and size', () => {
    const node = new UINode({ id: 'root', width: 400, height: 800 });
    const out = node.$inspect();
    expect(out).toContain('UINode#root');
    expect(out).toContain('400x800');
  });

  it('outputs children with indentation', () => {
    const root = new UINode({ id: 'root' });
    const panel = new UINode({ id: 'panel' });
    const btn = new UINode({ id: 'btn' });
    root.addChild(panel);
    panel.addChild(btn);

    const lines = root.$inspect().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^UINode#root/);
    expect(lines[1]).toMatch(/^  UINode#panel/);
    expect(lines[2]).toMatch(/^    UINode#btn/);
  });

  it('includes $text when available', () => {
    class MyButton extends UINode {
      constructor(public label: string) { super({ id: 'btn' }); }
      get $text() { return this.label; }
    }
    const btn = new MyButton('购买');
    expect(btn.$inspect()).toContain('"购买"');
  });

  it('includes interactive/disabled/visible state', () => {
    const node = new UINode({ id: 'a' });
    node.interactive = true;
    node.visible = false;
    expect(node.$inspect()).toContain('hidden');
  });

  it('depth=0 only outputs self', () => {
    const root = new UINode({ id: 'root' });
    root.addChild(new UINode({ id: 'child' }));
    const lines = root.$inspect(0).split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('root');
  });

  it('depth=1 outputs self and direct children', () => {
    const root = new UINode({ id: 'root' });
    const child = new UINode({ id: 'child' });
    child.addChild(new UINode({ id: 'grandchild' }));
    root.addChild(child);
    const lines = root.$inspect(1).split('\n');
    expect(lines).toHaveLength(2); // root + child, no grandchild
  });

  it('shows position when non-zero', () => {
    const node = new UINode({ id: 'n', x: 50, y: 100, width: 80, height: 40 });
    expect(node.$inspect()).toContain('at(50,100)');
  });

  it('omits position when at origin', () => {
    const node = new UINode({ id: 'n', width: 80, height: 40 });
    expect(node.$inspect()).not.toContain('at(');
  });
});

// ── 交互录制器 ────────────────────────────────────

describe('InteractionRecorder', () => {
  // 使用惰性导入，因为 recorder 可能还没实现
  async function getRecorder() {
    const mod = await import('../src/recorder');
    return mod;
  }

  it('records nothing when debug is off', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: false });
    rec.record({ t: 0, type: 'touchstart', x: 100, y: 200, path: 'root' });
    expect(rec.dump()).toHaveLength(0);
  });

  it('records events when enabled', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: true });
    rec.record({ t: 0, type: 'touchstart', x: 100, y: 200, path: 'root > btn' });
    rec.record({ t: 50, type: 'touchend', x: 100, y: 200, path: 'root > btn', action: 'tap' });
    const log = rec.dump();
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe('touchstart');
    expect(log[1].action).toBe('tap');
  });

  it('respects ring buffer capacity', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: true, capacity: 3 });
    for (let i = 0; i < 5; i++) {
      rec.record({ t: i * 100, type: 'touchstart', x: i, y: i, path: 'root' });
    }
    const log = rec.dump();
    expect(log).toHaveLength(3);
    // oldest (0, 1) dropped, keep (2, 3, 4)
    expect(log[0].x).toBe(2);
    expect(log[2].x).toBe(4);
  });

  it('clear empties the buffer', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: true });
    rec.record({ t: 0, type: 'touchstart', x: 0, y: 0, path: 'root' });
    rec.clear();
    expect(rec.dump()).toHaveLength(0);
  });

  it('toggle enabled at runtime', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: false });
    rec.record({ t: 0, type: 'touchstart', x: 0, y: 0, path: 'root' });
    expect(rec.dump()).toHaveLength(0);

    rec.enabled = true;
    rec.record({ t: 100, type: 'touchstart', x: 1, y: 1, path: 'root' });
    expect(rec.dump()).toHaveLength(1);
  });

  it('snapshot field is optional', async () => {
    const { InteractionRecorder } = await getRecorder();
    const rec = new InteractionRecorder({ enabled: true });
    rec.record({ t: 0, type: 'touchstart', x: 0, y: 0, path: 'root', snapshot: 'Button#btn "OK"' });
    expect(rec.dump()[0].snapshot).toBe('Button#btn "OK"');
  });
});
