import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkinSystem, type SkinDefinition } from '../src/skin';
import { MemoryStorage } from '../src/storage';

const SKINS: SkinDefinition[] = [
  { id: 'default', name: '默认球', category: 'skin', free: true },
  { id: 'rainbow', name: '彩虹球', category: 'skin', price: 500 },
  { id: 'flame', name: '火焰球', category: 'skin', price: 500 },
  { id: 'sakura', name: '樱花', category: 'effect', price: 300 },
  { id: 'lightning', name: '雷电', category: 'effect', free: true },
];

describe('SkinSystem', () => {
  let skin: SkinSystem;

  beforeEach(() => {
    skin = new SkinSystem({
      storage: new MemoryStorage(),
      skins: SKINS,
    });
  });

  it('free skins are owned by default', () => {
    expect(skin.isOwned('default')).toBe(true);
    expect(skin.isOwned('lightning')).toBe(true);
    expect(skin.isOwned('rainbow')).toBe(false);
  });

  it('purchase marks skin as owned', () => {
    const ok = skin.purchase('rainbow');
    expect(ok).toBe(true);
    expect(skin.isOwned('rainbow')).toBe(true);
  });

  it('cannot purchase already owned skin', () => {
    expect(skin.purchase('default')).toBe(false);
  });

  it('cannot purchase unknown skin', () => {
    expect(skin.purchase('unknown')).toBe(false);
  });

  it('equip changes equipped skin for category', () => {
    skin.equip('default');
    expect(skin.getEquipped('skin')).toBe('default');
  });

  it('cannot equip unowned skin', () => {
    expect(skin.equip('rainbow')).toBe(false);
    expect(skin.getEquipped('skin')).toBeUndefined();
  });

  it('equip replaces previous in same category', () => {
    skin.equip('default');
    skin.purchase('rainbow');
    skin.equip('rainbow');
    expect(skin.getEquipped('skin')).toBe('rainbow');
  });

  it('different categories have independent equip', () => {
    skin.equip('default');
    skin.equip('lightning');
    expect(skin.getEquipped('skin')).toBe('default');
    expect(skin.getEquipped('effect')).toBe('lightning');
  });

  it('getOwned returns all owned skin ids', () => {
    expect(skin.getOwned().sort()).toEqual(['default', 'lightning']);
    skin.purchase('flame');
    expect(skin.getOwned().sort()).toEqual(['default', 'flame', 'lightning']);
  });

  it('getSkinsByCategory filters correctly', () => {
    const effects = skin.getSkinsByCategory('effect');
    expect(effects.map(s => s.id)).toEqual(['sakura', 'lightning']);
  });

  it('persists state across instances', () => {
    const storage = new MemoryStorage();
    const s1 = new SkinSystem({ storage, skins: SKINS });
    s1.purchase('rainbow');
    s1.equip('rainbow');

    const s2 = new SkinSystem({ storage, skins: SKINS });
    expect(s2.isOwned('rainbow')).toBe(true);
    expect(s2.getEquipped('skin')).toBe('rainbow');
  });

  it('emits purchase and equip events', () => {
    const onPurchase = vi.fn();
    const onEquip = vi.fn();
    skin.on('purchase', onPurchase);
    skin.on('equip', onEquip);

    skin.purchase('rainbow');
    expect(onPurchase).toHaveBeenCalledWith('rainbow');

    skin.equip('rainbow');
    expect(onEquip).toHaveBeenCalledWith('rainbow', 'skin');
  });
});
