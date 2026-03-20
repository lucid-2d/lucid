import { describe, it, expect, vi } from 'vitest';
import { LeaderboardPanel, type LeaderboardEntry } from '../src/leaderboard-panel';

describe('LeaderboardPanel', () => {
  const entries: LeaderboardEntry[] = [
    { rank: 1, name: '玩家A', score: 3560 },
    { rank: 2, name: '玩家B', score: 2890 },
    { rank: 3, name: '玩家C', score: 2100, isMe: true },
  ];

  it('renders entries', () => {
    const panel = new LeaderboardPanel({ entries });
    expect(panel.findById('entry-0')).not.toBeNull();
    expect(panel.findById('entry-1')).not.toBeNull();
    expect(panel.findById('entry-2')).not.toBeNull();
  });

  it('highlights my entry', () => {
    const panel = new LeaderboardPanel({ entries });
    expect(panel.findById('entry-2')?.$highlighted).toBe(true);
  });

  it('emits tabChange', () => {
    const panel = new LeaderboardPanel({
      entries,
      tabs: [{ key: 'friends', label: '好友' }, { key: 'global', label: '全球' }],
    });
    const handler = vi.fn();
    panel.$on('tabChange', handler);

    panel.findById('tab-bar')!.$emit('change', 'global');
    expect(handler).toHaveBeenCalledWith('global');
  });

  it('updateEntries refreshes list', () => {
    const panel = new LeaderboardPanel({ entries });
    panel.updateEntries([{ rank: 1, name: '新玩家', score: 9999 }]);
    expect(panel.findById('entry-0')?.$text).toContain('新玩家');
  });

  it('emits close', () => {
    const panel = new LeaderboardPanel({ entries });
    const handler = vi.fn();
    panel.$on('close', handler);
    panel.findById('close-btn')!.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });
});
