import { describe, it, expect, vi } from 'vitest';
import { BattlePassSystem, type BattlePassConfig } from '../src/battle-pass';
import { MemoryStorage } from '../src/storage';

const CONFIG: BattlePassConfig = {
  maxLevel: 5,
  xpPerLevel: 100,
  rewards: [
    { level: 1, freeReward: { id: 'coin-50', amount: 50 }, paidReward: { id: 'rainbow', amount: 1 } },
    { level: 2, freeReward: { id: 'coin-100', amount: 100 } },
    { level: 3, freeReward: { id: 'diamond-5', amount: 5 }, paidReward: { id: 'flame', amount: 1 } },
    { level: 4, freeReward: { id: 'coin-150', amount: 150 } },
    { level: 5, freeReward: { id: 'trophy-frame', amount: 1 }, paidReward: { id: 'sakura', amount: 1 } },
  ],
};

describe('BattlePassSystem', () => {
  it('initial state: level 1, 0 xp, not premium', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    const state = sys.getState();
    expect(state.level).toBe(1);
    expect(state.xp).toBe(0);
    expect(state.isPremium).toBe(false);
  });

  it('addXP increases xp', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(50);
    expect(sys.getState().xp).toBe(50);
  });

  it('addXP levels up when reaching threshold', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    const handler = vi.fn();
    sys.on('levelUp', handler);
    sys.addXP(150); // 100 for level up + 50 overflow
    const state = sys.getState();
    expect(state.level).toBe(2);
    expect(state.xp).toBe(50);
    expect(handler).toHaveBeenCalledWith(2);
  });

  it('addXP can level up multiple times', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(350); // should reach level 4 with 50 xp
    const state = sys.getState();
    expect(state.level).toBe(4);
    expect(state.xp).toBe(50);
  });

  it('cannot exceed maxLevel', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(1000);
    const state = sys.getState();
    expect(state.level).toBe(5);
  });

  it('claimFree works for reached levels', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(100); // level 2
    const r = sys.claimFree(1);
    expect(r).toEqual({ id: 'coin-50', amount: 50 });
    expect(sys.isFreeClaimed(1)).toBe(true);
  });

  it('cannot claimFree for unreached level', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    expect(sys.claimFree(3)).toBeNull();
  });

  it('cannot claimFree twice', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(100);
    sys.claimFree(1);
    expect(sys.claimFree(1)).toBeNull();
  });

  it('claimPaid requires premium', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.addXP(100);
    expect(sys.claimPaid(1)).toBeNull(); // not premium
    sys.unlockPremium();
    const r = sys.claimPaid(1);
    expect(r).toEqual({ id: 'rainbow', amount: 1 });
  });

  it('unlockPremium sets isPremium', () => {
    const sys = new BattlePassSystem({ storage: new MemoryStorage(), config: CONFIG });
    sys.unlockPremium();
    expect(sys.getState().isPremium).toBe(true);
  });

  it('persists across instances', () => {
    const storage = new MemoryStorage();
    const s1 = new BattlePassSystem({ storage, config: CONFIG });
    s1.addXP(150);
    s1.claimFree(1);

    const s2 = new BattlePassSystem({ storage, config: CONFIG });
    const state = s2.getState();
    expect(state.level).toBe(2);
    expect(state.xp).toBe(50);
    expect(s2.isFreeClaimed(1)).toBe(true);
  });
});
