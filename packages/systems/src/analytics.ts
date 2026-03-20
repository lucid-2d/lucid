/**
 * Analytics — 埋点系统
 *
 * 统一事件追踪接口。支持多个后端同时上报。
 */

export interface AnalyticsAdapter {
  track(event: string, params?: Record<string, any>): void;
}

/** 控制台输出（开发调试） */
export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, params?: Record<string, any>): void {
    console.log(`[Analytics] ${event}`, params ?? '');
  }
}

/** 静默适配器（生产环境禁用埋点时） */
export class NoopAnalyticsAdapter implements AnalyticsAdapter {
  track(): void {}
}

export interface AnalyticsOptions {
  adapters?: AnalyticsAdapter[];
}

export class AnalyticsSystem {
  private _adapters: AnalyticsAdapter[];

  constructor(opts: AnalyticsOptions = {}) {
    this._adapters = opts.adapters ?? [new ConsoleAnalyticsAdapter()];
  }

  /** 上报事件（同时发送到所有适配器） */
  track(event: string, params?: Record<string, any>): void {
    for (const a of this._adapters) {
      a.track(event, params);
    }
  }

  /** 添加适配器 */
  addAdapter(adapter: AnalyticsAdapter): void {
    this._adapters.push(adapter);
  }
}
