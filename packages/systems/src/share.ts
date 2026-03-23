/**
 * Share — 分享系统
 *
 * 统一微信/抖音分享和 Web 分享的接口。
 * 支持主动分享（代码触发）和被动分享（用户点菜单转发）。
 *
 * ```typescript
 * const share = new ShareSystem({ adapter: new WxShareAdapter() });
 *
 * // 注册被动分享（右上角胶囊菜单 → 转发）
 * share.enablePassiveShare({ title: '一键星际', imageUrl: 'share.png' });
 *
 * // 动态更新被动分享内容（如切换星域时）
 * share.setDefaultShare({ title: '我正在穿越回声星域' });
 *
 * // 主动分享（如通关后）
 * share.share({ title: '我通关了！', imageUrl: 'result.png' });
 * ```
 */

export interface ShareData {
  title: string;
  imageUrl?: string;
  query?: string;
}

export interface ShareAdapter {
  /** 主动分享 */
  share(data: ShareData): Promise<boolean>;
  /** 注册被动分享（菜单转发），返回更新函数 */
  enablePassiveShare?(defaultData: ShareData): void;
  /** 更新被动分享的默认内容 */
  setDefaultShare?(data: ShareData): void;
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
  // Web 没有被动分享概念
  enablePassiveShare() {}
  setDefaultShare() {}
}

/** 微信小游戏分享适配器 */
export class WxShareAdapter implements ShareAdapter {
  private _defaultData: ShareData = { title: '' };

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

  enablePassiveShare(defaultData: ShareData): void {
    this._defaultData = defaultData;
    const wx = (globalThis as any).wx;
    if (!wx) return;

    // 注册被动分享回调
    wx.onShareAppMessage(() => ({
      title: this._defaultData.title,
      imageUrl: this._defaultData.imageUrl,
      query: this._defaultData.query,
    }));

    // 注册朋友圈分享
    if (wx.onShareTimeline) {
      wx.onShareTimeline(() => ({
        title: this._defaultData.title,
        imageUrl: this._defaultData.imageUrl,
        query: this._defaultData.query,
      }));
    }

    // 显示分享菜单
    wx.showShareMenu?.({
      withShareTicket: false,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  }

  setDefaultShare(data: ShareData): void {
    this._defaultData = data;
  }
}

/** 抖音小游戏分享适配器 */
export class TtShareAdapter implements ShareAdapter {
  private _defaultData: ShareData = { title: '' };

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

  enablePassiveShare(defaultData: ShareData): void {
    this._defaultData = defaultData;
    const tt = (globalThis as any).tt;
    if (!tt) return;

    if (tt.onShareAppMessage) {
      tt.onShareAppMessage(() => ({
        title: this._defaultData.title,
        imageUrl: this._defaultData.imageUrl,
        query: this._defaultData.query,
      }));
    }

    tt.showShareMenu?.();
  }

  setDefaultShare(data: ShareData): void {
    this._defaultData = data;
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

  /** 主动分享（游戏内代码触发） */
  async share(data: ShareData): Promise<boolean> {
    return this._adapter.share(data);
  }

  /** 注册被动分享（启动时调用一次，启用菜单转发） */
  enablePassiveShare(defaultData: ShareData): void {
    this._adapter.enablePassiveShare?.(defaultData);
  }

  /** 动态更新被动分享的默认内容 */
  setDefaultShare(data: ShareData): void {
    this._adapter.setDefaultShare?.(data);
  }
}
