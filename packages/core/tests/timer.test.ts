import { describe, it, expect, vi } from 'vitest';
import { Timer, CountdownTimer } from '../src/timer';

describe('Timer', () => {
  it('accumulates elapsed time', () => {
    const t = new Timer();
    t.update(0.5);
    expect(t.elapsed).toBeCloseTo(0.5);
    t.update(0.3);
    expect(t.elapsed).toBeCloseTo(0.8);
  });

  it('pause stops accumulation', () => {
    const t = new Timer();
    t.update(0.5);
    t.pause();
    t.update(0.5);
    expect(t.elapsed).toBeCloseTo(0.5);
  });

  it('resume continues accumulation', () => {
    const t = new Timer();
    t.update(0.5);
    t.pause();
    t.update(1.0);
    t.resume();
    t.update(0.3);
    expect(t.elapsed).toBeCloseTo(0.8);
  });

  it('reset clears elapsed', () => {
    const t = new Timer();
    t.update(1.0);
    t.reset();
    expect(t.elapsed).toBe(0);
    expect(t.running).toBe(true);
  });
});

describe('CountdownTimer', () => {
  it('counts down from duration', () => {
    const cd = new CountdownTimer(10);
    cd.update(3);
    expect(cd.remaining).toBeCloseTo(7);
  });

  it('fires onTick callback', () => {
    const onTick = vi.fn();
    const cd = new CountdownTimer(10, { onTick });
    cd.update(1);
    expect(onTick).toHaveBeenCalledWith(9);
  });

  it('fires onComplete when reaching 0', () => {
    const onComplete = vi.fn();
    const cd = new CountdownTimer(5, { onComplete });
    cd.update(3);
    expect(onComplete).not.toHaveBeenCalled();
    cd.update(3); // overshoot
    expect(cd.remaining).toBe(0);
    expect(cd.finished).toBe(true);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not fire onComplete twice', () => {
    const onComplete = vi.fn();
    const cd = new CountdownTimer(2, { onComplete });
    cd.update(3);
    cd.update(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pause stops countdown', () => {
    const cd = new CountdownTimer(10);
    cd.update(3);
    cd.pause();
    cd.update(5);
    expect(cd.remaining).toBeCloseTo(7);
  });

  it('reset restores to full duration', () => {
    const cd = new CountdownTimer(10);
    cd.update(8);
    cd.reset();
    expect(cd.remaining).toBeCloseTo(10);
    expect(cd.finished).toBe(false);
  });

  it('progress returns 0~1 ratio', () => {
    const cd = new CountdownTimer(10);
    expect(cd.progress).toBeCloseTo(0);
    cd.update(5);
    expect(cd.progress).toBeCloseTo(0.5);
    cd.update(5);
    expect(cd.progress).toBeCloseTo(1);
  });
});
