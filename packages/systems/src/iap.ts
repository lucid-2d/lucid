/**
 * IAP — 应用内购买
 *
 * 统一微信虚拟支付 / 抖音支付 / Web 模拟购买的接口。
 *
 * ```typescript
 * const iap = new IAPSystem({
 *   adapter: new WxIAPAdapter({ offerId: 'xxx', appId: 'yyy' }),
 *   products: [
 *     { id: 'remove-ads', name: '去除广告', price: 600 },
 *     { id: 'coins-100', name: '100金币', price: 100 },
 *   ],
 * });
 *
 * const ok = await iap.purchase('remove-ads');
 * ```
 */

export interface IAPProduct {
  id: string;
  name: string;
  /** 价格（分） */
  price: number;
  desc?: string;
}

export interface IAPAdapter {
  /** 发起购买，返回是否成功 */
  purchase(productId: string, price: number): Promise<boolean>;
  /** 查询商品列表 */
  getProducts?(): Promise<IAPProduct[]>;
}

/** 空实现（自动成功，开发调试用） */
export class NoopIAPAdapter implements IAPAdapter {
  async purchase(productId: string): Promise<boolean> {
    console.log(`[IAP] purchase ${productId} (noop, auto-success)`);
    return true;
  }
}

/** 微信虚拟支付适配器（需要后端配合） */
export class WxIAPAdapter implements IAPAdapter {
  private _offerId: string;
  private _appId: string;

  constructor(opts: { offerId: string; appId: string }) {
    this._offerId = opts.offerId;
    this._appId = opts.appId;
  }

  async purchase(productId: string, price: number): Promise<boolean> {
    const wx = (globalThis as any).wx;
    if (!wx?.requestMidasPayment) return false;
    return new Promise((resolve) => {
      wx.requestMidasPayment({
        mode: 'game',
        offerId: this._offerId,
        currencyType: 'CNY',
        buyQuantity: price, // 单位：分
        env: 0, // 0=正式, 1=沙箱
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }
}

/** 抖音支付适配器（需要后端配合） */
export class TtIAPAdapter implements IAPAdapter {
  async purchase(productId: string, price: number): Promise<boolean> {
    const tt = (globalThis as any).tt;
    if (!tt?.requestOrder) return false;
    return new Promise((resolve) => {
      tt.requestOrder({
        goodType: 0,
        currencyType: 'CNY',
        buyQuantity: price,
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }
}

export interface IAPOptions {
  adapter?: IAPAdapter;
  products?: IAPProduct[];
}

type EventHandler = (...args: any[]) => void;

export class IAPSystem {
  private _adapter: IAPAdapter;
  private _products: IAPProduct[];
  private _handlers = new Map<string, EventHandler[]>();

  constructor(opts: IAPOptions = {}) {
    this._adapter = opts.adapter ?? new NoopIAPAdapter();
    this._products = opts.products ?? [];
  }

  /** 发起购买 */
  async purchase(productId: string): Promise<boolean> {
    const product = this._products.find(p => p.id === productId);
    const ok = await this._adapter.purchase(productId, product?.price ?? 0);
    if (ok) this._emit('purchase', productId);
    return ok;
  }

  /** 获取商品定义 */
  getProduct(id: string): IAPProduct | undefined {
    return this._products.find(p => p.id === id);
  }

  /** 获取所有商品 */
  getProducts(): IAPProduct[] {
    return [...this._products];
  }

  on(event: string, handler: EventHandler): void {
    const list = this._handlers.get(event) ?? [];
    list.push(handler);
    this._handlers.set(event, list);
  }

  private _emit(event: string, ...args: any[]): void {
    const list = this._handlers.get(event);
    if (list) for (const h of list) h(...args);
  }
}
