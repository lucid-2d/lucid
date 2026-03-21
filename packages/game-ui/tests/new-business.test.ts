import { describe, it, expect, vi } from 'vitest';
import { BattlePassPanel } from '../src/battle-pass-panel';
import { LuckyBoxDialog } from '../src/lucky-box-dialog';
import { CoinShopPanel } from '../src/coin-shop-panel';
import { PrivacyDialog } from '../src/privacy-dialog';
import { Button } from '@lucid-2d/ui';

describe('BattlePassPanel', () => {
  const rewards = [
    { level: 1, freeReward: { icon: '🪙', label: '+50 金币' }, paidReward: { icon: '🌈', label: '彩虹球' } },
    { level: 2, freeReward: { icon: '🪙', label: '+100 金币' } },
    { level: 3, freeReward: { icon: '💎', label: '+5 钻石' }, paidReward: { icon: '🔥', label: '火焰球' } },
  ];

  it('renders with correct level', () => {
    const panel = new BattlePassPanel({ currentLevel: 2, currentXP: 50, xpToNext: 100, isPremium: false, rewards });
    expect(panel.$inspect()).toContain('battle-pass');
  });

  it('emits claimReward', () => {
    const panel = new BattlePassPanel({ currentLevel: 2, currentXP: 50, xpToNext: 100, isPremium: true, rewards });
    const handler = vi.fn();
    panel.$on('claimReward', handler);

    // Find and tap the first reward row
    const row = panel.findById('reward-0');
    row?.$emit('tap');
    expect(handler).toHaveBeenCalledWith(1, 'free');
  });

  it('emits buyPremium when not premium', () => {
    const panel = new BattlePassPanel({ currentLevel: 1, currentXP: 0, xpToNext: 100, isPremium: false, rewards });
    const handler = vi.fn();
    panel.$on('buyPremium', handler);
    panel.findById('buy-premium')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('no buy button when already premium', () => {
    const panel = new BattlePassPanel({ currentLevel: 1, currentXP: 0, xpToNext: 100, isPremium: true, rewards });
    expect(panel.findById('buy-premium')).toBeNull();
  });

  it('emits close', () => {
    const panel = new BattlePassPanel({ currentLevel: 1, currentXP: 0, xpToNext: 100, isPremium: false, rewards });
    const handler = vi.fn();
    panel.$on('close', handler);
    panel.findById('close-btn')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('LuckyBoxDialog', () => {
  it('shows fragment progress', () => {
    const dialog = new LuckyBoxDialog({ fragments: 3, redeemCost: 10, freeOpens: 2, adOpens: 1 });
    expect(dialog.findById('frag-bar')).not.toBeNull();
  });

  it('emits open on button tap', () => {
    const dialog = new LuckyBoxDialog({ fragments: 0, redeemCost: 10, freeOpens: 1, adOpens: 0 });
    const handler = vi.fn();
    dialog.$on('open', handler);
    dialog.findById('open-btn')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits openByAd', () => {
    const dialog = new LuckyBoxDialog({ fragments: 0, redeemCost: 10, freeOpens: 0, adOpens: 2 });
    const handler = vi.fn();
    dialog.$on('openByAd', handler);
    dialog.findById('ad-open-btn')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('redeem disabled when fragments insufficient', () => {
    const dialog = new LuckyBoxDialog({ fragments: 3, redeemCost: 10, freeOpens: 0, adOpens: 0 });
    expect(dialog.findById('redeem-btn')?.$disabled).toBe(true);
  });

  it('redeem enabled when fragments sufficient', () => {
    const dialog = new LuckyBoxDialog({ fragments: 10, redeemCost: 10, freeOpens: 0, adOpens: 0 });
    expect(dialog.findById('redeem-btn')?.$disabled).toBe(false);
  });
});

describe('CoinShopPanel', () => {
  const items = [
    { id: 'revive', name: '复活币', desc: '复活一次', icon: '💫', cost: 500 },
    { id: 'multi', name: '多球', desc: '+2 球', icon: '🏀', cost: 300, owned: 1 },
  ];

  it('renders items', () => {
    const panel = new CoinShopPanel({ coins: 1000, items });
    expect(panel.findById('coin-item-revive')).not.toBeNull();
    expect(panel.findById('coin-item-multi')).not.toBeNull();
  });

  it('emits purchase on card tap', () => {
    const panel = new CoinShopPanel({ coins: 1000, items });
    const handler = vi.fn();
    panel.$on('purchase', handler);
    panel.findById('coin-item-revive')?.$emit('tap');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'revive' }));
  });

  it('emits close', () => {
    const panel = new CoinShopPanel({ coins: 0, items });
    const handler = vi.fn();
    panel.$on('close', handler);
    panel.findById('close-btn')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('updateCoins refreshes display', () => {
    const panel = new CoinShopPanel({ coins: 1000, items });
    panel.updateCoins(500);
    const label = panel.findById('coin-balance');
    expect(label?.$text).toContain('500');
  });
});

describe('PrivacyDialog', () => {
  it('has agree button', () => {
    const dialog = new PrivacyDialog();
    expect(dialog.findById('agree-btn')).not.toBeNull();
  });

  it('emits agree and closes', () => {
    const dialog = new PrivacyDialog();
    const handler = vi.fn();
    dialog.$on('agree', handler);
    dialog.findById('agree-btn')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits viewPolicy', () => {
    const dialog = new PrivacyDialog();
    const handler = vi.fn();
    dialog.$on('viewPolicy', handler);
    dialog.findById('view-privacy')?.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('no close button (must agree)', () => {
    const dialog = new PrivacyDialog();
    expect(dialog.findById('modal-close')).toBeNull();
  });
});
