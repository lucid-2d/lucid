import { describe, it, expect, vi } from 'vitest';
import { timeSlice } from '../src/time-slice';

describe('timeSlice', () => {
  it('executes all work items', async () => {
    const results: number[] = [];
    await timeSlice({
      total: 10,
      batch: 3,
      work: (i) => results.push(i),
    });
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('calls onProgress', async () => {
    const progress: number[] = [];
    await timeSlice({
      total: 8,
      batch: 4,
      work: () => {},
      onProgress: (p) => progress.push(Math.round(p * 100)),
    });
    // After batch 1 (4/8=50%), final (100%)
    expect(progress).toContain(50);
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('handles total=0', async () => {
    const progress: number[] = [];
    await timeSlice({
      total: 0,
      work: () => {},
      onProgress: (p) => progress.push(p),
    });
    // onProgress(1) should still be called
    expect(progress).toEqual([1]);
  });

  it('default batch is 4', async () => {
    let yieldCount = 0;
    const origRAF = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: any) => setTimeout(cb, 0)) as any;

    await timeSlice({
      total: 12,
      work: () => {},
      onProgress: () => { yieldCount++; },
    });

    globalThis.requestAnimationFrame = origRAF;
    // 12 items / batch 4 = yields at 4, 8, then final = 3 progress calls
    expect(yieldCount).toBe(3);
  });
});
