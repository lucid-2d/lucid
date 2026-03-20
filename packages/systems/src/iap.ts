/**
 * IAP — 应用内购买
 *
 * 统一微信 Midas / 抖音支付 / Web 模拟购买的接口。
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
  purchase(productId: string): Promise<boolean>;
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
    const ok = await this._adapter.purchase(productId);
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
