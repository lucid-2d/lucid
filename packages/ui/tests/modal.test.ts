import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../src/modal';
import { Button } from '../src/button';
import { UINode } from '@lucid-2d/core';

describe('Modal', () => {
  it('is hidden by default', () => {
    const modal = new Modal({ title: '测试' });
    expect(modal.visible).toBe(false);
  });

  it('open() makes visible and emits open', () => {
    const modal = new Modal({ title: '测试' });
    const handler = vi.fn();
    modal.$on('open', handler);
    modal.open();
    expect(modal.visible).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('close() emits close after animation', () => {
    const modal = new Modal({ title: '测试' });
    const handler = vi.fn();
    modal.$on('close', handler);
    modal.open();
    modal.$update(0.5); // 跳过开场动画
    modal.close();
    // 动画中还没 emit
    expect(handler).not.toHaveBeenCalled();
    // 动画结束
    modal.$update(0.5);
    expect(handler).toHaveBeenCalledOnce();
    expect(modal.visible).toBe(false);
  });

  it('$text returns title', () => {
    const modal = new Modal({ title: '确认购买' });
    expect(modal.$text).toBe('确认购买');
  });

  it('content accepts children', () => {
    const modal = new Modal({ title: '测试' });
    const btn = new Button({ text: '确定' });
    modal.content.addChild(btn);
    // Modal 有内置关闭按钮 + 用户按钮
    expect(modal.findByType(Button)).toHaveLength(2);
    expect(modal.content.findByType(Button)).toHaveLength(1);
  });

  it('title can be updated', () => {
    const modal = new Modal({ title: '旧标题' });
    modal.title = '新标题';
    expect(modal.$text).toBe('新标题');
  });

  // ── 新增：动画 ──

  it('open() triggers scale + alpha animation', () => {
    const modal = new Modal({ title: '测试' });
    modal.open();
    // 初始 scale < 1, alpha < 1
    expect(modal.animScale).toBeLessThan(1);
    expect(modal.animAlpha).toBeLessThan(1);

    // 动画推进
    modal.$update(0.3);
    expect(modal.animScale).toBeCloseTo(1, 1);
    expect(modal.animAlpha).toBeCloseTo(1, 1);
  });

  it('close() triggers reverse animation then hides', () => {
    const modal = new Modal({ title: '测试' });
    modal.open();
    modal.$update(0.5); // 跳过开场动画
    expect(modal.animAlpha).toBeCloseTo(1, 1);

    modal.close();
    modal.$update(0.05);
    modal.$update(0.5);
    expect(modal.visible).toBe(false);
  });
});

// ── 交互测试 ──

describe('Modal interaction', () => {
  it('hitTest captures all touches when visible (modal overlay)', () => {
    const modal = new Modal({ title: '测试', screenWidth: 390, screenHeight: 844 });
    modal.open();

    // Click inside panel → returns something (close button or modal itself)
    const hitInside = modal.hitTest(modal.x + 50, modal.y + 50);
    expect(hitInside).not.toBeNull();

    // Click outside panel (overlay area) → still returns modal (not null)
    const hitOutside = modal.hitTest(10, 10);
    expect(hitOutside).toBe(modal);
  });

  it('hitTest returns null when hidden', () => {
    const modal = new Modal({ title: '测试' });
    // Not opened → invisible
    const hit = modal.hitTest(200, 400);
    expect(hit).toBeNull();
  });

  it('close button triggers close', () => {
    const modal = new Modal({ title: '测试' });
    const closeHandler = vi.fn();
    modal.$on('close', closeHandler);
    modal.open();
    modal.$update(0.5); // finish open animation

    // Find and tap close button
    const closeBtn = modal.findById('modal-close') as Button;
    expect(closeBtn).toBeTruthy();
    closeBtn.$emit('touchstart', {});
    closeBtn.$emit('touchend', {});

    // Wait for close animation
    modal.$update(0.5);
    expect(modal.visible).toBe(false);
    expect(closeHandler).toHaveBeenCalledOnce();
  });

  it('modal blocks interaction with nodes behind it', () => {
    const root = new UINode({ id: 'root', width: 390, height: 844 });

    const bgBtn = new UINode({ id: 'bg-btn', x: 100, y: 400, width: 200, height: 50 });
    bgBtn.interactive = true;
    root.addChild(bgBtn);

    const modal = new Modal({ title: '测试', screenWidth: 390, screenHeight: 844 });
    root.addChild(modal);

    // Before open: bg button is hittable
    expect(root.hitTest(200, 425)?.id).toBe('bg-btn');

    // After open: modal blocks everything
    modal.open();
    const hit = root.hitTest(200, 425);
    // Should hit modal or its children, NOT bg-btn
    expect(hit?.id).not.toBe('bg-btn');
  });

  it('fitContent adjusts height based on children', () => {
    const modal = new Modal({ title: '测试', screenWidth: 390, screenHeight: 844 });
    const child = new UINode({ y: 0, height: 100 });
    modal.content.addChild(child);

    modal.fitContent(20);
    expect(modal.height).toBe(50 + 100 + 20); // content.y + child bottom + pad
  });
});
