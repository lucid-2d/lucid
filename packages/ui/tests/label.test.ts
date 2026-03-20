import { describe, it, expect } from 'vitest';
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
});
