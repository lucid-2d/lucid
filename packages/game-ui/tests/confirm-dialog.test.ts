import { describe, it, expect } from 'vitest';
import { ConfirmDialog } from '../src/confirm-dialog';

describe('ConfirmDialog', () => {
  it('creates with required props', () => {
    const dialog = new ConfirmDialog({
      title: '确认退出？',
      confirm: { onTap: () => {} },
    });
    expect(dialog.id).toBe('confirm-dialog');
    expect(dialog.findById('confirm-btn')).toBeDefined();
  });

  it('confirm button triggers callback and event', () => {
    let tapped = false;
    let eventFired = false;
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => { tapped = true; } },
    });
    dialog.$on('confirm', () => { eventFired = true; });

    const btn = dialog.findById('confirm-btn')!;
    btn.$emit('tap');
    expect(tapped).toBe(true);
    expect(eventFired).toBe(true);
  });

  it('cancel button triggers callback and event', () => {
    let cancelled = false;
    let eventFired = false;
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => {} },
      cancel: { onTap: () => { cancelled = true; } },
    });
    dialog.$on('cancel', () => { eventFired = true; });

    const btn = dialog.findById('cancel-btn')!;
    btn.$emit('tap');
    expect(cancelled).toBe(true);
    expect(eventFired).toBe(true);
  });

  it('no cancel button when cancel not provided', () => {
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => {} },
    });
    expect(dialog.findById('cancel-btn')).toBeNull();
  });

  it('uses custom button text', () => {
    const dialog = new ConfirmDialog({
      title: '删除',
      confirm: { text: '删除', variant: 'danger', onTap: () => {} },
      cancel: { text: '保留', variant: 'ghost', onTap: () => {} },
    });

    const confirmBtn = dialog.findById('confirm-btn')!;
    const cancelBtn = dialog.findById('cancel-btn')!;
    expect(confirmBtn.$text).toBe('删除');
    expect(cancelBtn.$text).toBe('保留');
  });

  it('uses default button text when not specified', () => {
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => {} },
      cancel: { onTap: () => {} },
    });

    expect(dialog.findById('confirm-btn')!.$text).toBe('确认');
    expect(dialog.findById('cancel-btn')!.$text).toBe('取消');
  });

  it('shows message when provided', () => {
    const dialog = new ConfirmDialog({
      title: '退出',
      message: '确定要退出游戏吗？进度不会保存。',
      confirm: { onTap: () => {} },
    });

    const msg = dialog.findById('confirm-message');
    expect(msg).toBeDefined();
    expect(msg!.$text).toBe('确定要退出游戏吗？进度不会保存。');
  });

  it('no message node when message not provided', () => {
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => {} },
    });
    expect(dialog.findById('confirm-message')).toBeNull();
  });

  it('respects custom screen dimensions', () => {
    const dialog = new ConfirmDialog({
      title: '确认',
      confirm: { onTap: () => {} },
      screenWidth: 320,
      screenHeight: 568,
    });
    // Panel width = min(320-40, 300) = 280
    expect(dialog.width).toBeLessThanOrEqual(280);
  });
});
