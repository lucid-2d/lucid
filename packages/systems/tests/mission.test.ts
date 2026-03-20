import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionSystem, type MissionDefinition } from '../src/mission';
import { MemoryStorage } from '../src/storage';

const MISSIONS: MissionDefinition[] = [
  { id: 'play-3', name: '玩3局', target: 3, reward: 50, type: 'daily' },
  { id: 'score-500', name: '单局500分', target: 500, reward: 100, type: 'daily', progressType: 'max' },
  { id: 'win-20', name: '累计胜利20场', target: 20, reward: 200, type: 'lifetime' },
];

describe('MissionSystem', () => {
  let sys: MissionSystem;
  let now: number;

  beforeEach(() => {
    now = new Date('2026-03-20T10:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    sys = new MissionSystem({ storage: new MemoryStorage(), missions: MISSIONS });
  });

  it('initial: all missions at 0 progress, not claimed', () => {
    const all = sys.getAll();
    expect(all.every(m => m.progress === 0 && !m.claimed)).toBe(true);
  });

  it('addProgress updates mission progress', () => {
    sys.addProgress('play-3', 1);
    expect(sys.getProgress('play-3')).toBe(1);
    sys.addProgress('play-3', 1);
    expect(sys.getProgress('play-3')).toBe(2);
  });

  it('max progressType keeps highest', () => {
    sys.addProgress('score-500', 300);
    sys.addProgress('score-500', 200);
    expect(sys.getProgress('score-500')).toBe(300);
    sys.addProgress('score-500', 600);
    expect(sys.getProgress('score-500')).toBe(600);
  });

  it('isComplete returns true at target', () => {
    sys.addProgress('play-3', 3);
    expect(sys.isComplete('play-3')).toBe(true);
  });

  it('claim returns reward and marks claimed', () => {
    sys.addProgress('play-3', 3);
    const reward = sys.claim('play-3');
    expect(reward).toBe(50);
    expect(sys.isClaimed('play-3')).toBe(true);
  });

  it('cannot claim incomplete mission', () => {
    sys.addProgress('play-3', 1);
    expect(sys.claim('play-3')).toBe(0);
  });

  it('cannot claim twice', () => {
    sys.addProgress('play-3', 3);
    sys.claim('play-3');
    expect(sys.claim('play-3')).toBe(0);
  });

  it('daily missions reset next day', () => {
    sys.addProgress('play-3', 2);
    // Advance to next day
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000);
    expect(sys.getProgress('play-3')).toBe(0); // reset
  });

  it('lifetime missions persist across days', () => {
    sys.addProgress('win-20', 5);
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000);
    expect(sys.getProgress('win-20')).toBe(5); // not reset
  });

  it('emits complete event', () => {
    const handler = vi.fn();
    sys.on('complete', handler);
    sys.addProgress('play-3', 3);
    expect(handler).toHaveBeenCalledWith('play-3');
  });

  it('persists across instances', () => {
    const storage = new MemoryStorage();
    const s1 = new MissionSystem({ storage, missions: MISSIONS });
    s1.addProgress('win-20', 8);

    const s2 = new MissionSystem({ storage, missions: MISSIONS });
    expect(s2.getProgress('win-20')).toBe(8);
  });
});
