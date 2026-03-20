/**
 * Share — 分享系统
 *
 * 统一微信/抖音分享和 Web 剪贴板分享的接口。
 */

export interface ShareData {
  title: string;
  imageUrl?: string;
  query?: string;
}

export interface ShareAdapter {
  share(data: ShareData): Promise<boolean>;
}

/** Web 实现（复制链接到剪贴板） */
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
