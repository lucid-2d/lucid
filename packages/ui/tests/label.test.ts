import { describe, it, expect, vi } from 'vitest';
import { Label } from '../src/label';

describe('Label', () => {
  it('$text returns text', () => {
    const label = new Label({ text: '得分: 1280' });
    expect(label.$text).toBe('得分: 1280');
  });

  it('text setter updates value', () => {
    const label = new Label({ text: 'old' });
    label.text = 'new';
    expect(label.$text).toBe('new');
  });

  it('defaults to left align, 16px, white', () => {
    const label = new Label({ text: 'hi' });
    expect(label.align).toBe('left');
    expect(label.fontSize).toBe(16);
  });

  it('is not interactive', () => {
    const label = new Label({ text: 'hi' });
    expect(label.interactive).toBe(false);
  });

  it('supports multiline text with \\n', () => {
    const label = new Label({ text: '第一行\n第二行\n第三行', width: 200, height: 80 });
    expect(label.$text).toBe('第一行\n第二行\n第三行');
    const ctx = {
      fillStyle: '', font: '', textAlign: '', textBaseline: '',
      fillText: vi.fn(),
    };
    label['draw'](ctx as any);
    expect(ctx.fillText).toHaveBeenCalledTimes(3);
  });

  it('wrap: false by default', () => {
    const label = new Label({ text: 'hello' });
    expect(label.wrap).toBe(false);
  });

  it('wrap: true enables auto line-wrapping', () => {
    const label = new Label({
      text: 'Hello World This Is A Long Text',
      width: 100, height: 200,
      wrap: true,
    });
    const ctx = {
      fillStyle: '', font: '', textAlign: '', textBaseline: '',
      fillText: vi.fn(),
      measureText: (t: string) => ({ width: t.length * 8 }),
    };
    label['draw'](ctx as any);
    // 31 chars × 8 = 248, maxWidth 100 → should wrap into multiple lines
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(1);
  });

  it('maxLines truncates with ellipsis', () => {
    const label = new Label({
      text: 'A B C D E F G H I J K L M N O P',
      width: 60, height: 200,
      wrap: true,
      maxLines: 2,
    });
    const ctx = {
      fillStyle: '', font: '', textAlign: '', textBaseline: '',
      fillText: vi.fn(),
      measureText: (t: string) => ({ width: t.length * 8 }),
    };
    label['draw'](ctx as any);
    expect(ctx.fillText.mock.calls.length).toBe(2);
    const lastLine = ctx.fillText.mock.calls[1][0];
    expect(lastLine).toContain('...');
  });

  it('lineHeight is configurable', () => {
    const label = new Label({ text: 'hi', lineHeight: 2.0 });
    expect(label.lineHeight).toBe(2.0);
  });

  it('verticalAlign defaults to middle', () => {
    const label = new Label({ text: 'hi' });
    expect(label.verticalAlign).toBe('middle');
  });
});
