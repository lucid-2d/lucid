/**
 * Timer / CountdownTimer — 通用计时器
 *
 * 由游戏循环驱动（每帧调用 update(dt)），不依赖 setTimeout/setInterval。
 * 在录制回放时 tick(dt) 精确推进，保证计时器行为一致。
 */

/** 正计时器 */
export class Timer {
  private _elapsed = 0;
  private _running = true;

  get elapsed(): number { return this._elapsed; }
  get running(): boolean { return this._running; }

  update(dt: number): void {
    if (this._running) this._elapsed += dt;
  }

  pause(): void { this._running = false; }
  resume(): void { this._running = true; }

  reset(): void {
    this._elapsed = 0;
    this._running = true;
  }
}

/** 倒计时器 */
export interface CountdownOptions {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
}

export class CountdownTimer {
  private _duration: number;
  private _remaining: number;
  private _running = true;
  private _finished = false;
  private _onTick?: (remaining: number) => void;
  private _onComplete?: () => void;

  constructor(duration: number, opts?: CountdownOptions) {
    this._duration = duration;
    this._remaining = duration;
    this._onTick = opts?.onTick;
    this._onComplete = opts?.onComplete;
  }

  get remaining(): number { return this._remaining; }
  get finished(): boolean { return this._finished; }
  get running(): boolean { return this._running; }
  get duration(): number { return this._duration; }

  /** 已过去的比例 0~1（0=刚开始, 1=结束） */
  get progress(): number {
    return this._duration > 0 ? 1 - this._remaining / this._duration : 1;
  }

  update(dt: number): void {
    if (!this._running || this._finished) return;

    this._remaining = Math.max(0, this._remaining - dt);
    this._onTick?.(this._remaining);

    if (this._remaining <= 0) {
      this._finished = true;
      this._onComplete?.();
    }
  }

  pause(): void { this._running = false; }
  resume(): void { this._running = true; }

  reset(): void {
    this._remaining = this._duration;
    this._finished = false;
    this._running = true;
  }
}
