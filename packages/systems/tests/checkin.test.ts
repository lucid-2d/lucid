import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckinSystem } from '../src/checkin';
import { MemoryStorage } from '../src/storage';

describe('CheckinSystem', () => {
  let checkin: CheckinSystem;
  let now: number;

  beforeEach(() => {
    now = new Date('2026-03-20T10:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    checkin = new CheckinSystem({
      storage: new MemoryStorage(),
      rewards: [10, 10, 15, 20, 20, 25, 50],
    });
  });

  it('initial state: day 0, not claimed', () => {
    const state = checkin.getState();
    expect(state.currentDay).toBe(0);
    expect(state.claimed).toBe(false);
    expect(state.streak).toBe(0);
  });

  it('claim first day', () => {
    const reward = checkin.claim();
    expect(reward).toBe(10);
    const state = checkin.getState();
    expect(state.currentDay).toBe(0);
    expect(state.claimed).toBe(true);
    expect(state.streak).toBe(1);
  });

  it('cannot claim twice on same day', () => {
    checkin.claim();
    const reward = checkin.claim();
    expect(reward).toBe(0);
  });

  it('next day advances currentDay', () => {
    checkin.claim();
    // Advance to next day
    const tomorrow = now + 24 * 60 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(tomorrow);
    const state = checkin.getState();
    expect(state.currentDay).toBe(1);
    expect(state.claimed).toBe(false);
    expect(state.streak).toBe(1);
  });

  it('streak resets after missing a day', () => {
    checkin.claim();
    // Skip a day (advance 2 days)
    const dayAfterTomorrow = now + 2 * 24 * 60 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(dayAfterTomorrow);
    const state = checkin.getState();
    expect(state.currentDay).toBe(0); // reset to day 0
    expect(state.streak).toBe(0);
  });

  it('cycle wraps after all days claimed', () => {
    // Claim all 7 days
    for (let d = 0; d < 7; d++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + d * 24 * 60 * 60 * 1000);
      checkin.claim();
    }
    // Day 8 = new cycle
    vi.spyOn(Date, 'now').mockReturnValue(now + 7 * 24 * 60 * 60 * 1000);
    const state = checkin.getState();
    expect(state.currentDay).toBe(0);
    expect(state.claimed).toBe(false);
    expect(state.streak).toBe(7);
  });

  it('getReward returns correct reward for day', () => {
    expect(checkin.getReward(0)).toBe(10);
    expect(checkin.getReward(6)).toBe(50);
  });

  it('persists state across instances', () => {
    const storage = new MemoryStorage();
    const c1 = new CheckinSystem({ storage, rewards: [10, 20, 30] });
    c1.claim();

    const c2 = new CheckinSystem({ storage, rewards: [10, 20, 30] });
    const state = c2.getState();
    expect(state.claimed).toBe(true);
    expect(state.streak).toBe(1);
  });
});
