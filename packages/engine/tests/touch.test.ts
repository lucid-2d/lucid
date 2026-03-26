/**
 * 触摸坐标转换测试 — 验证 localX/localY 正确传递到组件
 */
import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app';
import { UINode } from '@lucid-2d/core';
import { createMockCanvas } from './helpers/mock-canvas';

describe('touch coordinate conversion', () => {
  it('touchend passes correct localX/localY to nested node', () => {
    const canvas = createMockCanvas(390, 844);
    const app = createApp({ platform: 'web', canvas });

    const panel = new UINode({ id: 'panel', x: 100, y: 200, width: 200, height: 400 });
    const btn = new UINode({ id: 'btn', x: 50, y: 50, width: 80, height: 40 });
    btn.interactive = true;
    app.root.addChild(panel);
    panel.addChild(btn);

    let receivedLocal = { x: -1, y: -1 };
    btn.$on('touchend', (e: any) => {
      receivedLocal = { x: e.localX, y: e.localY };
    });

    // Simulate mouse click at world (160, 260) = panel(100,200) + btn(50,50) + offset(10,10)
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 160, clientY: 260 }));
    canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: 160, clientY: 260 }));

    // localX should be 10 (160 - 100 - 50), localY should be 10 (260 - 200 - 50)
    expect(receivedLocal.x).toBeCloseTo(10);
    expect(receivedLocal.y).toBeCloseTo(10);
  });
});

