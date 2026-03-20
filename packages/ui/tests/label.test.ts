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
});
