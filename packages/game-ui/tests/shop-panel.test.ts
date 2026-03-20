import { describe, it, expect, vi } from 'vitest';
import { ShopPanel, type ShopItem } from '../src/shop-panel';
import { Button } from '@lucid/ui';

describe('ShopPanel', () => {
  const tabs = [
    { key: 'skin', label: '皮肤' },
    { key: 'effect', label: '特效' },
  ];

  const items: ShopItem[] = [
    { id: 'rainbow', name: '彩虹球', desc: '色相旋转', icon: '🌈', category: 'skin', owned: true, equipped: false },
    { id: 'flame', name: '火焰球', desc: '橙红光晕', icon: '🔥', category: 'skin', owned: true, equipped: true },
    { id: 'sakura', name: '樱花', desc: '粉色飘落', icon: '🌸', category: 'effect', owned: false, equipped: false, price: '500' },
  ];

  it('renders cards for active tab', () => {
    const shop = new ShopPanel({ tabs, items });
    // default tab is first = skin, has 2 items
    const cards = shop.findById('card-rainbow');
    expect(cards).not.toBeNull();
    expect(shop.findById('card-flame')).not.toBeNull();
  });

  it('emits select on card tap', () => {
    const shop = new ShopPanel({ tabs, items });
    const handler = vi.fn();
    shop.$on('select', handler);

    shop.findById('card-rainbow')!.$emit('tap');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'rainbow' }));
  });

  it('emits equip for owned unequipped item', () => {
    const shop = new ShopPanel({ tabs, items });
    const handler = vi.fn();
    shop.$on('equip', handler);

    // select rainbow (owned, not equipped)
    shop.findById('card-rainbow')!.$emit('tap');
    // tap action button
    shop.findById('action-btn')!.$emit('tap');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'rainbow' }));
  });

  it('emits purchase for unowned item', () => {
    const shop = new ShopPanel({ tabs, items });
    const handler = vi.fn();
    shop.$on('purchase', handler);

    // switch to effect tab
    shop.findById('tab-bar')!.$emit('change', 'effect');
    // select sakura (not owned)
    shop.findById('card-sakura')!.$emit('tap');
    shop.findById('action-btn')!.$emit('tap');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'sakura' }));
  });

  it('emits close', () => {
    const shop = new ShopPanel({ tabs, items });
    const handler = vi.fn();
    shop.$on('close', handler);
    shop.findById('close-btn')!.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('updateItems refreshes data', () => {
    const shop = new ShopPanel({ tabs, items });
    const newItems = items.map(i => i.id === 'sakura' ? { ...i, owned: true } : i);
    shop.updateItems(newItems);
    // sakura now owned
    shop.findById('tab-bar')!.$emit('change', 'effect');
    shop.findById('card-sakura')!.$emit('tap');

    const equipHandler = vi.fn();
    shop.$on('equip', equipHandler);
    shop.findById('action-btn')!.$emit('tap');
    expect(equipHandler).toHaveBeenCalled(); // equip, not purchase
  });
});
