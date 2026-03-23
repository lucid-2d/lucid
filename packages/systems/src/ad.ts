/**
 * Ad — 广告系统
 *
 * 统一激励视频、插屏和 Banner 广告的接口。
 * 业务代码调用 ad.showRewarded('revive')，不关心底层是微信、抖音还是 Web。
 *
 * ```typescript
 * // Web 开发环境
 * const ads = new AdSystem(); // NoopAdAdapter, auto-grant
 *
 * // 微信小游戏
 * const ads = new AdSystem({
 *   adapter: new WxAdAdapter({
 *     rewardedId: 'adunit-xxx',
 *     interstitialId: 'adunit-yyy',
 *     bannerId: 'adunit-zzz',
 *   }),
 * });
 *
 * // 使用
 * const watched = await ads.showRewarded('revive');
 * if (watched) revivePlayer();
 * ```
 */

export interface AdAdapter {
  /** 展示激励视频，返回是否看完 */
  showRewarded(): Promise<boolean>;
  /** 展示插屏广告 */
  showInterstitial?(): Promise<void>;
  /** 展示 Banner（返回关闭函数） */
  showBanner?(): () => void;
  /** 预加载激励视频 */
  preload?(): void;
}

/** 空实现（Web 开发环境 / 无广告时） */
export class NoopAdAdapter implements AdAdapter {
  async showRewarded(): Promise<boolean> {
    console.log('[Ad] showRewarded (noop, auto-grant)');
    return true;
  }
  async showInterstitial(): Promise<void> {
    console.log('[Ad] showInterstitial (noop)');
  }
}

/** 微信小游戏广告适配器 */
export class WxAdAdapter implements AdAdapter {
  private _rewardedId: string;
  private _interstitialId?: string;
  private _bannerId?: string;

  constructor(opts: { rewardedId: string; interstitialId?: string; bannerId?: string }) {
    this._rewardedId = opts.rewardedId;
    this._interstitialId = opts.interstitialId;
    this._bannerId = opts.bannerId;
  }

  async showRewarded(): Promise<boolean> {
    const wx = (globalThis as any).wx;
    if (!wx) return false;
    return new Promise((resolve) => {
      const ad = wx.createRewardedVideoAd({ adUnitId: this._rewardedId });
      ad.onClose((res: any) => resolve(res?.isEnded !== false));
      ad.onError(() => resolve(false));
      ad.show().catch(() => ad.load().then(() => ad.show()).catch(() => resolve(false)));
    });
  }

  async showInterstitial(): Promise<void> {
    if (!this._interstitialId) return;
    const wx = (globalThis as any).wx;
    if (!wx) return;
    try {
      const ad = wx.createInterstitialAd({ adUnitId: this._interstitialId });
      await ad.show();
    } catch {}
  }

  showBanner(): () => void {
    if (!this._bannerId) return () => {};
    const wx = (globalThis as any).wx;
    if (!wx) return () => {};
    const { windowWidth, windowHeight } = wx.getSystemInfoSync();
    const ad = wx.createBannerAd({
      adUnitId: this._bannerId,
      style: { left: 0, top: windowHeight - 80, width: windowWidth },
    });
    ad.show();
    return () => ad.hide();
  }

  preload(): void {
    const wx = (globalThis as any).wx;
    if (!wx) return;
    const ad = wx.createRewardedVideoAd({ adUnitId: this._rewardedId });
    ad.load();
  }
}

/** 抖音小游戏广告适配器 */
export class TtAdAdapter implements AdAdapter {
  private _rewardedId: string;
  private _interstitialId?: string;

  constructor(opts: { rewardedId: string; interstitialId?: string }) {
    this._rewardedId = opts.rewardedId;
    this._interstitialId = opts.interstitialId;
  }

  async showRewarded(): Promise<boolean> {
    const tt = (globalThis as any).tt;
    if (!tt) return false;
    return new Promise((resolve) => {
      const ad = tt.createRewardedVideoAd({ adUnitId: this._rewardedId });
      ad.onClose((res: any) => resolve(res?.isEnded !== false));
      ad.onError(() => resolve(false));
      ad.show().catch(() => ad.load().then(() => ad.show()).catch(() => resolve(false)));
    });
  }

  async showInterstitial(): Promise<void> {
    if (!this._interstitialId) return;
    const tt = (globalThis as any).tt;
    if (!tt) return;
    try {
      const ad = tt.createInterstitialAd({ adUnitId: this._interstitialId });
      await ad.show();
    } catch {}
  }
}

export interface AdOptions {
  adapter?: AdAdapter;
}

export class AdSystem {
  private _adapter: AdAdapter;
  private _totalWatched = 0;

  constructor(opts: AdOptions = {}) {
    this._adapter = opts.adapter ?? new NoopAdAdapter();
  }

  /** 展示激励视频广告，返回用户是否看完 */
  async showRewarded(placement?: string): Promise<boolean> {
    const result = await this._adapter.showRewarded();
    if (result) this._totalWatched++;
    return result;
  }

  /** 展示插屏广告 */
  async showInterstitial(): Promise<void> {
    await this._adapter.showInterstitial?.();
  }

  /** 展示 Banner，返回隐藏函数 */
  showBanner(): (() => void) | null {
    return this._adapter.showBanner?.() ?? null;
  }

  /** 预加载激励视频 */
  preload(): void {
    this._adapter.preload?.();
  }

  /** 已看广告总次数 */
  get totalWatched(): number { return this._totalWatched; }
}
