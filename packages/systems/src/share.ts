/**
 * Share — 分享系统
 *
 * 统一微信/抖音分享和 Web 分享的接口。
 *
 * ```typescript
 * // 微信小游戏
 * const share = new ShareSystem({ adapter: new WxShareAdapter() });
 * share.share({ title: '我通关了！', imageUrl: 'share.png' });
 * ```
 */

export interface ShareData {
  title: string;
  imageUrl?: string;
  query?: string;
}

export interface ShareAdapter {
  share(data: ShareData): Promise<boolean>;
}

/** Web 实现（navigator.share / console.log） */
export class WebShareAdapter implements ShareAdapter {
  async share(data: ShareData): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: data.title, url: window.location.href });
        return true;
      } catch { return false; }
    }
    console.log('[Share]', data.title);
    return true;
  }
}

/** 微信小游戏分享适配器 */
export class WxShareAdapter implements ShareAdapter {
  async share(data: ShareData): Promise<boolean> {
    const wx = (globalThis as any).wx;
    if (!wx) return false;
    try {
      wx.shareAppMessage({
        title: data.title,
        imageUrl: data.imageUrl,
        query: data.query,
      });
      return true;
    } catch { return false; }
  }
}

/** 抖音小游戏分享适配器 */
export class TtShareAdapter implements ShareAdapter {
  async share(data: ShareData): Promise<boolean> {
    const tt = (globalThis as any).tt;
    if (!tt) return false;
    return new Promise((resolve) => {
      tt.shareAppMessage({
        title: data.title,
        imageUrl: data.imageUrl,
        query: data.query,
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }
}

export interface ShareOptions {
  adapter?: ShareAdapter;
}

export class ShareSystem {
  private _adapter: ShareAdapter;

  constructor(opts: ShareOptions = {}) {
    this._adapter = opts.adapter ?? new WebShareAdapter();
  }

  async share(data: ShareData): Promise<boolean> {
    return this._adapter.share(data);
  }
}
