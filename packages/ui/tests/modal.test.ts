import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../src/modal';
import { Button } from '../src/button';
import { UINode } from '@lucid/core';

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

  it('close() emits close', () => {
    const modal = new Modal({ title: '测试' });
    const handler = vi.fn();
    modal.$on('close', handler);
    modal.open();
    modal.close();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('$text returns title', () => {
    const modal = new Modal({ title: '确认购买' });
    expect(modal.$text).toBe('确认购买');
  });

  it('content accepts children', () => {
    const modal = new Modal({ title: '测试' });
    const btn = new Button({ text: '确定' });
    modal.content.addChild(btn);
    expect(modal.findByType(Button)).toHaveLength(1);
  });

  it('title can be updated', () => {
    const modal = new Modal({ title: '旧标题' });
    modal.title = '新标题';
    expect(modal.$text).toBe('新标题');
  });
});
