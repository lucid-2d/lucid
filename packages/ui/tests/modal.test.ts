import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../src/modal';
import { Button } from '../src/button';

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
    // 关闭动画刚开始，alpha 还接近 1
    modal.$update(0.05);
    // 动画结束后隐藏
    modal.$update(0.5);
    expect(modal.visible).toBe(false);
  });
});
