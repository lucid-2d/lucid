import { describe, it, expect } from 'vitest';
import { UINode } from '../src/node';

function box(id: string, w: number, h: number, opts?: Record<string, any>): UINode {
  const n = new UINode({ id, width: w, height: h, ...opts });
  return n;
}

function container(w: number, h: number, opts?: Record<string, any>): UINode {
  return new UINode({ id: 'ct', width: w, height: h, ...opts });
}

/** Force layout computation by calling $render with a stub ctx */
function layout(node: UINode): void {
  const ctx = { save() {}, restore() {}, translate() {}, globalAlpha: 1 } as any;
  node.$render(ctx);
}

// ── Row Layout ──

describe('Row layout', () => {
  it('positions children left-to-right', () => {
    const c = container(300, 100, { layout: 'row' });
    c.addChild(box('a', 50, 30));
    c.addChild(box('b', 80, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(0);
    expect(c.findById('b')!.x).toBe(50);
  });

  it('applies gap between children', () => {
    const c = container(300, 100, { layout: 'row', gap: 10 });
    c.addChild(box('a', 50, 30));
    c.addChild(box('b', 50, 30));
    c.addChild(box('c', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(0);
    expect(c.findById('b')!.x).toBe(60);
    expect(c.findById('c')!.x).toBe(120);
  });

  it('applies padding', () => {
    const c = container(300, 100, { layout: 'row', padding: 20 });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(20);
    expect(c.findById('a')!.y).toBe(20);
  });

  it('applies [t, r, b, l] padding', () => {
    const c = container(300, 100, { layout: 'row', padding: [10, 20, 30, 40] as any });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(40); // left padding
    expect(c.findById('a')!.y).toBe(10); // top padding
  });

  it('justifyContent: center', () => {
    const c = container(300, 100, { layout: 'row', justifyContent: 'center' });
    c.addChild(box('a', 50, 30));
    c.addChild(box('b', 50, 30));
    layout(c);

    // total used = 100, remaining = 200, offset = 100
    expect(c.findById('a')!.x).toBe(100);
    expect(c.findById('b')!.x).toBe(150);
  });

  it('justifyContent: end', () => {
    const c = container(300, 100, { layout: 'row', justifyContent: 'end' });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(250);
  });

  it('justifyContent: space-between', () => {
    const c = container(300, 100, { layout: 'row', justifyContent: 'space-between' });
    c.addChild(box('a', 50, 30));
    c.addChild(box('b', 50, 30));
    c.addChild(box('c', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(0);
    expect(c.findById('c')!.x).toBe(250);
    // middle should be centered
    expect(c.findById('b')!.x).toBe(125);
  });

  it('alignItems: center', () => {
    const c = container(300, 100, { layout: 'row', alignItems: 'center' });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.y).toBe(35); // (100-30)/2
  });

  it('alignItems: end', () => {
    const c = container(300, 100, { layout: 'row', alignItems: 'end' });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.y).toBe(70); // 100-30
  });

  it('skips hidden children', () => {
    const c = container(300, 100, { layout: 'row', gap: 10 });
    const a = box('a', 50, 30);
    const b = box('b', 50, 30);
    b.visible = false;
    const d = box('d', 50, 30);
    c.addChild(a);
    c.addChild(b);
    c.addChild(d);
    layout(c);

    expect(a.x).toBe(0);
    expect(d.x).toBe(60); // 50 + 10 gap, b skipped
  });
});

// ── Column Layout ──

describe('Column layout', () => {
  it('positions children top-to-bottom', () => {
    const c = container(100, 300, { layout: 'column' });
    c.addChild(box('a', 80, 40));
    c.addChild(box('b', 80, 60));
    layout(c);

    expect(c.findById('a')!.y).toBe(0);
    expect(c.findById('b')!.y).toBe(40);
  });

  it('applies gap and padding', () => {
    const c = container(100, 300, { layout: 'column', gap: 8, padding: 16 });
    c.addChild(box('a', 60, 40));
    c.addChild(box('b', 60, 40));
    layout(c);

    expect(c.findById('a')!.x).toBe(16);
    expect(c.findById('a')!.y).toBe(16);
    expect(c.findById('b')!.y).toBe(64); // 16 + 40 + 8
  });

  it('justifyContent: center (column)', () => {
    const c = container(100, 300, { layout: 'column', justifyContent: 'center' });
    c.addChild(box('a', 80, 40));
    layout(c);

    expect(c.findById('a')!.y).toBe(130); // (300-40)/2
  });

  it('alignItems: center (column → horizontal center)', () => {
    const c = container(200, 300, { layout: 'column', alignItems: 'center' });
    c.addChild(box('a', 80, 40));
    layout(c);

    expect(c.findById('a')!.x).toBe(60); // (200-80)/2
  });
});

// ── Flex ──

describe('Flex sizing', () => {
  it('flex: 1 fills remaining space in row', () => {
    const c = container(300, 100, { layout: 'row' });
    c.addChild(box('fixed', 100, 30));
    const fill = box('fill', 0, 30, { flex: 1 });
    c.addChild(fill);
    layout(c);

    expect(fill.width).toBe(200);
    expect(fill.x).toBe(100);
  });

  it('multiple flex children share space proportionally', () => {
    const c = container(300, 100, { layout: 'row', gap: 0 });
    const a = box('a', 0, 30, { flex: 1 });
    const b = box('b', 0, 30, { flex: 2 });
    c.addChild(a);
    c.addChild(b);
    layout(c);

    expect(a.width).toBe(100); // 1/3 * 300
    expect(b.width).toBe(200); // 2/3 * 300
  });

  it('flex with fixed children and gap', () => {
    const c = container(300, 100, { layout: 'row', gap: 10 });
    c.addChild(box('left', 50, 30));
    const mid = box('mid', 0, 30, { flex: 1 });
    c.addChild(mid);
    c.addChild(box('right', 50, 30));
    layout(c);

    // remaining = 300 - 50 - 50 - 2*10 = 180
    expect(mid.width).toBe(180);
    expect(mid.x).toBe(60); // 50 + 10
  });

  it('flex in column', () => {
    const c = container(100, 400, { layout: 'column' });
    c.addChild(box('header', 100, 50));
    const body = box('body', 100, 0, { flex: 1 });
    c.addChild(body);
    c.addChild(box('footer', 100, 50));
    layout(c);

    expect(body.height).toBe(300); // 400 - 50 - 50
    expect(body.y).toBe(50);
  });

  it('respects minWidth constraint', () => {
    const c = container(200, 100, { layout: 'row' });
    c.addChild(box('fixed', 180, 30));
    const fill = box('fill', 0, 30, { flex: 1, minWidth: 50 });
    c.addChild(fill);
    layout(c);

    expect(fill.width).toBe(50); // min enforced (remaining=20 < min=50)
  });

  it('respects maxWidth constraint', () => {
    const c = container(500, 100, { layout: 'row' });
    const fill = box('fill', 0, 30, { flex: 1, maxWidth: 200 });
    c.addChild(fill);
    layout(c);

    expect(fill.width).toBe(200); // max enforced
  });
});

// ── alignSelf ──

describe('alignSelf', () => {
  it('overrides container alignItems for specific child', () => {
    const c = container(300, 100, { layout: 'row', alignItems: 'start' });
    c.addChild(box('a', 50, 30)); // alignItems=start → y=0
    const b = box('b', 50, 30, { alignSelf: 'end' });
    c.addChild(b);
    layout(c);

    expect(c.findById('a')!.y).toBe(0);
    expect(b.y).toBe(70); // 100 - 30
  });

  it('alignSelf: center in column', () => {
    const c = container(200, 300, { layout: 'column', alignItems: 'start' });
    const a = box('a', 80, 40, { alignSelf: 'center' });
    c.addChild(a);
    layout(c);

    expect(a.x).toBe(60); // (200-80)/2
  });
});

// ── Wrap ──

describe('Wrap layout', () => {
  it('wraps row children to next line', () => {
    const c = container(200, 400, { layout: 'row', wrap: true, gap: 0 });
    c.addChild(box('a', 80, 40));
    c.addChild(box('b', 80, 40));
    c.addChild(box('c', 80, 40)); // doesn't fit in first row (80+80+80=240 > 200)
    layout(c);

    expect(c.findById('a')!.y).toBe(0);
    expect(c.findById('b')!.y).toBe(0);
    expect(c.findById('c')!.y).toBe(40); // second row
    expect(c.findById('c')!.x).toBe(0);
  });

  it('wraps with gap', () => {
    const c = container(200, 400, { layout: 'row', wrap: true, gap: 10 });
    c.addChild(box('a', 90, 40));
    c.addChild(box('b', 90, 40));
    c.addChild(box('c', 90, 40));
    layout(c);

    // a=90, b=90+10=100, total=190 <= 200, c wraps
    expect(c.findById('a')!.y).toBe(0);
    expect(c.findById('b')!.y).toBe(0);
    expect(c.findById('c')!.y).toBe(50); // 40 + 10 gap
  });

  it('columns auto-calculates child width', () => {
    const c = container(210, 400, { layout: 'row', wrap: true, gap: 10, columns: 3 });
    const a = box('a', 0, 40);
    const b = box('b', 0, 40);
    const d = box('d', 0, 40);
    const e = box('e', 0, 40);
    c.addChild(a);
    c.addChild(b);
    c.addChild(d);
    c.addChild(e);
    layout(c);

    // childW = (210 - 2*10) / 3 ≈ 63.33
    const expectedW = (210 - 20) / 3;
    expect(a.width).toBeCloseTo(expectedW);
    expect(b.width).toBeCloseTo(expectedW);

    // First row: a, b, d
    expect(a.y).toBe(0);
    expect(b.y).toBe(0);
    expect(d.y).toBe(0);
    // Second row: e
    expect(e.y).toBe(50); // 40 + 10 gap
  });

  it('wrap with alignItems: center', () => {
    const c = container(200, 400, { layout: 'row', wrap: true, gap: 0, alignItems: 'center' });
    c.addChild(box('tall', 80, 60));
    c.addChild(box('short', 80, 30));
    layout(c);

    // Same row, row height = 60
    expect(c.findById('tall')!.y).toBe(0);
    expect(c.findById('short')!.y).toBe(15); // (60-30)/2
  });

  it('wrap with justifyContent: center', () => {
    const c = container(200, 400, { layout: 'row', wrap: true, gap: 0, justifyContent: 'center' });
    c.addChild(box('a', 60, 40));
    c.addChild(box('b', 60, 40));
    layout(c);

    // used = 120, remaining = 80, offset = 40
    expect(c.findById('a')!.x).toBe(40);
    expect(c.findById('b')!.x).toBe(100);
  });
});

// ── Constructor options ──

describe('Layout via constructor options', () => {
  it('sets layout properties from options', () => {
    const c = new UINode({
      width: 300, height: 200,
      layout: 'column', gap: 12, padding: 16,
      alignItems: 'center', justifyContent: 'center',
    });

    expect(c.layout).toBe('column');
    expect(c.gap).toBe(12);
    expect(c.padding).toBe(16);
    expect(c.alignItems).toBe('center');
    expect(c.justifyContent).toBe('center');
  });

  it('sets child properties from options', () => {
    const n = new UINode({
      width: 100, height: 50,
      flex: 2, alignSelf: 'end',
      minWidth: 80, maxWidth: 200,
    });

    expect(n.flex).toBe(2);
    expect(n.alignSelf).toBe('end');
    expect(n.minWidth).toBe(80);
    expect(n.maxWidth).toBe(200);
  });
});

// ── Auto-sizing (hug content) ──

describe('Auto-sizing', () => {
  it('column container auto-calculates height from children', () => {
    const c = new UINode({ id: 'ct', width: 200, layout: 'column', gap: 10 });
    c.addChild(box('a', 100, 40));
    c.addChild(box('b', 100, 60));
    layout(c);

    expect(c.height).toBe(110); // 40 + 10 + 60
    expect(c.findById('a')!.y).toBe(0);
    expect(c.findById('b')!.y).toBe(50);
  });

  it('column with padding auto-sizes correctly', () => {
    const c = new UINode({ id: 'ct', width: 200, layout: 'column', gap: 0, padding: 20 });
    c.addChild(box('a', 100, 50));
    layout(c);

    expect(c.height).toBe(90); // 20 + 50 + 20
  });

  it('row container auto-calculates width from children', () => {
    const c = new UINode({ id: 'ct', height: 100, layout: 'row', gap: 8 });
    c.addChild(box('a', 60, 30));
    c.addChild(box('b', 80, 30));
    layout(c);

    expect(c.width).toBe(148); // 60 + 8 + 80
  });

  it('row auto-calculates height from tallest child', () => {
    const c = new UINode({ id: 'ct', width: 300, layout: 'row' });
    c.addChild(box('a', 60, 30));
    c.addChild(box('b', 60, 50));
    layout(c);

    expect(c.height).toBe(50); // max child height
  });

  it('nested auto-sizing works bottom-up', () => {
    const outer = new UINode({ id: 'ct', width: 300, layout: 'column', gap: 10 });
    const inner1 = new UINode({ id: 'in1', width: 300, layout: 'column', gap: 5 });
    inner1.addChild(box('a', 100, 30));
    inner1.addChild(box('b', 100, 40));
    outer.addChild(inner1);
    outer.addChild(box('c', 100, 20));
    layout(outer);

    expect(inner1.height).toBe(75); // 30 + 5 + 40
    expect(outer.height).toBe(105); // 75 + 10 + 20
    expect(outer.findById('c')!.y).toBe(85); // 75 + 10
  });
});

// ── Edge cases ──

describe('Edge cases', () => {
  it('no children does nothing', () => {
    const c = container(300, 100, { layout: 'row' });
    layout(c); // should not throw
  });

  it('single child with space-between behaves like start', () => {
    const c = container(300, 100, { layout: 'row', justifyContent: 'space-between' });
    c.addChild(box('a', 50, 30));
    layout(c);

    expect(c.findById('a')!.x).toBe(0);
  });

  it('node without layout does not auto-position children', () => {
    const c = container(300, 100);
    const a = box('a', 50, 30);
    a.x = 42;
    a.y = 17;
    c.addChild(a);
    layout(c);

    expect(a.x).toBe(42); // untouched
    expect(a.y).toBe(17);
  });

  it('layout recomputes every render', () => {
    const c = container(300, 100, { layout: 'row', gap: 10 });
    const a = box('a', 50, 30);
    c.addChild(a);
    layout(c);
    expect(a.x).toBe(0);

    // Add another child and re-render
    c.addChild(box('b', 50, 30));
    layout(c);
    expect(c.findById('b')!.x).toBe(60);
  });

  it('padding with wrap and columns', () => {
    const c = container(240, 400, {
      layout: 'row', wrap: true, columns: 3, gap: 10,
      padding: [20, 15, 20, 15] as any,
    });
    for (let i = 0; i < 6; i++) c.addChild(box(`i${i}`, 0, 40));
    layout(c);

    // available = 240 - 15 - 15 = 210
    // childW = (210 - 2*10) / 3 ≈ 63.33
    const first = c.findById('i0')!;
    expect(first.x).toBe(15); // left padding
    expect(first.y).toBe(20); // top padding

    const fourth = c.findById('i3')!;
    expect(fourth.x).toBe(15);
    expect(fourth.y).toBe(70); // 20 + 40 + 10
  });
});
