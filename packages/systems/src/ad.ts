/**
 * Ad — 广告系统
 *
 * 统一激励视频广告和 Banner 广告的接口。
 * 业务代码调用 ad.showRewarded()，不关心底层是微信、抖音还是 Web。
 */

export interface AdAdapter {
  /** 展示激励视频，返回是否看完 */
  showRewarded(): Promise<boolean>;
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
  async showRewarded(): Promise<boolean> {
    const result = await this._adapter.showRewarded();
    if (result) this._totalWatched++;
    return result;
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
