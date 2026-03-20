import { describe, it, expect, vi } from 'vitest';
import { AdSystem, NoopAdAdapter, type AdAdapter } from '../src/ad';
import { IAPSystem, type IAPAdapter } from '../src/iap';
import { ShareSystem, type ShareAdapter } from '../src/share';
import { AnalyticsSystem, type AnalyticsAdapter } from '../src/analytics';

describe('AdSystem', () => {
  it('noop adapter auto-grants reward', async () => {
    const ad = new AdSystem();
    const result = await ad.showRewarded();
    expect(result).toBe(true);
    expect(ad.totalWatched).toBe(1);
  });

  it('custom adapter can reject', async () => {
    const adapter: AdAdapter = { showRewarded: async () => false };
    const ad = new AdSystem({ adapter });
    const result = await ad.showRewarded();
    expect(result).toBe(false);
    expect(ad.totalWatched).toBe(0);
  });

  it('tracks total watched count', async () => {
    const ad = new AdSystem();
    await ad.showRewarded();
    await ad.showRewarded();
    expect(ad.totalWatched).toBe(2);
  });
});

describe('IAPSystem', () => {
  it('noop adapter auto-succeeds', async () => {
    const iap = new IAPSystem();
    const ok = await iap.purchase('premium');
    expect(ok).toBe(true);
  });

  it('custom adapter can reject', async () => {
    const adapter: IAPAdapter = { purchase: async () => false };
    const iap = new IAPSystem({ adapter });
    expect(await iap.purchase('x')).toBe(false);
  });

  it('emits purchase event on success', async () => {
    const iap = new IAPSystem();
    const handler = vi.fn();
    iap.on('purchase', handler);
    await iap.purchase('premium');
    expect(handler).toHaveBeenCalledWith('premium');
  });

  it('getProduct returns defined product', () => {
    const iap = new IAPSystem({ products: [{ id: 'gem-60', name: '60钻石', price: 600 }] });
    expect(iap.getProduct('gem-60')?.name).toBe('60钻石');
    expect(iap.getProduct('missing')).toBeUndefined();
  });
});

describe('ShareSystem', () => {
  it('share resolves true with default adapter', async () => {
    const share = new ShareSystem({ adapter: { share: async () => true } });
    const ok = await share.share({ title: 'test' });
    expect(ok).toBe(true);
  });

  it('custom adapter can reject', async () => {
    const adapter: ShareAdapter = { share: async () => false };
    const share = new ShareSystem({ adapter });
    expect(await share.share({ title: 'test' })).toBe(false);
  });
});

describe('AnalyticsSystem', () => {
  it('tracks event to all adapters', () => {
    const a1: AnalyticsAdapter = { track: vi.fn() };
    const a2: AnalyticsAdapter = { track: vi.fn() };
    const analytics = new AnalyticsSystem({ adapters: [a1, a2] });
    analytics.track('game_start', { level: 1 });
    expect(a1.track).toHaveBeenCalledWith('game_start', { level: 1 });
    expect(a2.track).toHaveBeenCalledWith('game_start', { level: 1 });
  });

  it('addAdapter works', () => {
    const analytics = new AnalyticsSystem({ adapters: [] });
    const a: AnalyticsAdapter = { track: vi.fn() };
    analytics.addAdapter(a);
    analytics.track('test');
    expect(a.track).toHaveBeenCalledWith('test', undefined);
  });
});
