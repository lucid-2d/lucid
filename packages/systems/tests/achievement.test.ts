import { describe, it, expect, vi } from 'vitest';
import { AchievementSystem, type AchievementDefinition } from '../src/achievement';
import { MemoryStorage } from '../src/storage';

const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-win', name: '初次胜利', desc: '赢得第一场比赛', target: 1 },
  { id: 'win-10', name: '十连胜', desc: '累计赢得10场', target: 10 },
  { id: 'score-1000', name: '千分达人', desc: '单局得分1000', target: 1000, type: 'max' },
  { id: 'collect-all', name: '收藏家', desc: '收集所有皮肤', target: 5 },
];

describe('AchievementSystem', () => {
  it('initial: no achievements unlocked', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    expect(sys.getUnlocked()).toEqual([]);
    expect(sys.getProgress('first-win')).toBe(0);
  });

  it('addProgress increments and unlocks at target', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    sys.addProgress('first-win', 1);
    expect(sys.isUnlocked('first-win')).toBe(true);
  });

  it('addProgress accumulates for cumulative type', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    sys.addProgress('win-10', 3);
    expect(sys.getProgress('win-10')).toBe(3);
    expect(sys.isUnlocked('win-10')).toBe(false);
    sys.addProgress('win-10', 7);
    expect(sys.isUnlocked('win-10')).toBe(true);
  });

  it('max type keeps highest value', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    sys.addProgress('score-1000', 500);
    expect(sys.getProgress('score-1000')).toBe(500);
    sys.addProgress('score-1000', 300); // lower, should not decrease
    expect(sys.getProgress('score-1000')).toBe(500);
    sys.addProgress('score-1000', 1200); // higher, should update
    expect(sys.getProgress('score-1000')).toBe(1200);
    expect(sys.isUnlocked('score-1000')).toBe(true);
  });

  it('emits unlock event', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    const handler = vi.fn();
    sys.on('unlock', handler);
    sys.addProgress('first-win', 1);
    expect(handler).toHaveBeenCalledWith('first-win');
  });

  it('does not emit unlock twice', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    const handler = vi.fn();
    sys.on('unlock', handler);
    sys.addProgress('first-win', 1);
    sys.addProgress('first-win', 1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('getAll returns definitions with progress', () => {
    const sys = new AchievementSystem({ storage: new MemoryStorage(), achievements: ACHIEVEMENTS });
    sys.addProgress('win-10', 5);
    const all = sys.getAll();
    const w = all.find(a => a.id === 'win-10')!;
    expect(w.progress).toBe(5);
    expect(w.unlocked).toBe(false);
  });

  it('persists across instances', () => {
    const storage = new MemoryStorage();
    const s1 = new AchievementSystem({ storage, achievements: ACHIEVEMENTS });
    s1.addProgress('win-10', 6);

    const s2 = new AchievementSystem({ storage, achievements: ACHIEVEMENTS });
    expect(s2.getProgress('win-10')).toBe(6);
  });
});
