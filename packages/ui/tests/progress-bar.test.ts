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
});
