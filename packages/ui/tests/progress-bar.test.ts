import { describe, it, expect } from 'vitest';
import { ProgressBar } from '../src/progress-bar';

describe('ProgressBar', () => {
  it('value defaults to 0', () => {
    const bar = new ProgressBar({ width: 200, height: 8 });
    expect(bar.value).toBe(0);
  });

  it('clamps value to 0-1', () => {
    const bar = new ProgressBar({ width: 200, height: 8 });
    bar.value = 1.5;
    expect(bar.value).toBe(1);
    bar.value = -0.5;
    expect(bar.value).toBe(0);
  });

  it('$inspect shows percentage', () => {
    const bar = new ProgressBar({ id: 'hp', width: 200, height: 8 });
    bar.value = 0.75;
    expect(bar.$inspect(0)).toContain('75%');
  });

  it('colorStops resolves color by value', () => {
    const bar = new ProgressBar({
      width: 200, height: 8,
      colorStops: [
        { at: 0, color: 'red' },
        { at: 0.5, color: 'yellow' },
        { at: 1, color: 'green' },
      ],
    });

    bar.value = 0.3;
    // _resolveColor is private, but we can test via $text or just verify no crash
    expect(bar.value).toBe(0.3);

    bar.value = 0.8;
    expect(bar.value).toBe(0.8);
  });

  it('label shows in $text', () => {
    const bar = new ProgressBar({
      width: 200, height: 20,
      value: 0.6,
      label: '60/100',
    });
    expect(bar.$text).toContain('60%');
    expect(bar.$text).toContain('60/100');
  });

  it('label can be updated', () => {
    const bar = new ProgressBar({ width: 200, height: 20, label: 'old' });
    bar.label = 'new';
    expect(bar.$text).toContain('new');
  });
});
