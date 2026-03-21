import { describe, it, expect, vi } from 'vitest';
import { CheckinDialog } from '../src/checkin-dialog';
import { Button } from '@lucid-2d/ui';

describe('CheckinDialog', () => {
  const rewards = [10, 10, 15, 20, 20, 25, 50];

  it('is a Modal with title', () => {
    const d = new CheckinDialog({ rewards, currentDay: 0, claimed: false });
    expect(d.$text).toContain('签到');
  });

  it('highlights current day', () => {
    const d = new CheckinDialog({ rewards, currentDay: 3, claimed: false });
    const day = d.findById('day-3');
    expect(day).not.toBeNull();
    expect(day!.$highlighted).toBe(true);
  });

  it('previous days are marked completed', () => {
    const d = new CheckinDialog({ rewards, currentDay: 3, claimed: false });
    expect(d.findById('day-0')?.$highlighted).toBe(false);
    expect(d.findById('day-2')?.$highlighted).toBe(false);
  });

  it('claim button emits claim with day and reward', () => {
    const d = new CheckinDialog({ rewards, currentDay: 3, claimed: false });
    let result: { day: number; reward: number } | null = null;
    d.$on('claim', (day: number, reward: number) => { result = { day, reward }; });

    const btn = d.findById('claim-btn')!;
    btn.$emit('tap');
    expect(result).toEqual({ day: 3, reward: 20 });
  });

  it('claim button disabled when already claimed', () => {
    const d = new CheckinDialog({ rewards, currentDay: 3, claimed: true });
    const btn = d.findById('claim-btn');
    expect(btn?.$disabled).toBe(true);
  });

  it('creates 7 day nodes', () => {
    const d = new CheckinDialog({ rewards, currentDay: 0, claimed: false });
    for (let i = 0; i < 7; i++) {
      expect(d.findById(`day-${i}`)).not.toBeNull();
    }
  });
});
