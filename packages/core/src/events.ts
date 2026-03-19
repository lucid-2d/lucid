/**
 * EventEmitter — Vue 风格事件系统
 *
 * $on / $off / $emit / $once
 */

type Handler = (...args: any[]) => void;

export class EventEmitter {
  private _listeners: Map<string, Handler[]> = new Map();

  /** 注册事件监听 */
  $on(event: string, handler: Handler): this {
    let list = this._listeners.get(event);
    if (!list) {
      list = [];
      this._listeners.set(event, list);
    }
    list.push(handler);
    return this;
  }

  /** 移除事件监听。不传 handler 则移除该事件所有监听。 */
  $off(event: string, handler?: Handler): this {
    if (!handler) {
      this._listeners.delete(event);
      return this;
    }
    const list = this._listeners.get(event);
    if (list) {
      const idx = list.findIndex(
        h => h === handler || (h as any)._original === handler,
      );
      if (idx !== -1) list.splice(idx, 1);
      if (list.length === 0) this._listeners.delete(event);
    }
    return this;
  }

  /** 触发事件 */
  $emit(event: string, ...args: any[]): void {
    const list = this._listeners.get(event);
    if (!list) return;
    // snapshot: 遍历副本，避免在 emit 期间注册的 handler 被本次触发
    const snapshot = list.slice();
    for (const handler of snapshot) {
      handler(...args);
    }
  }

  /** 单次监听 */
  $once(event: string, handler: Handler): this {
    const wrapper: Handler = (...args) => {
      this.$off(event, wrapper);
      handler(...args);
    };
    // 保存原始引用，使 $off(event, handler) 也能移除 wrapper
    (wrapper as any)._original = handler;
    return this.$on(event, wrapper);
  }
}
