/**
 * ScreenShake — 屏幕震动效果
 */

export class ScreenShake {
  private intensity = 0;
  private timer = 0;
  private decay = 0.85;
  private _offsetX = 0;
  private _offsetY = 0;

  /** 触发震动（取较大值，不覆盖更强的震动） */
  trigger(intensity: number, duration: number): void {
    if (intensity > this.intensity) this.intensity = intensity;
    this.timer = Math.max(this.timer, duration);
  }

  update(dt: number): void {
    if (this.timer <= 0) {
      this._offsetX = 0;
      this._offsetY = 0;
      return;
    }
    this.timer -= dt;
    this.intensity *= this.decay;
    this._offsetX = (Math.random() - 0.5) * 2 * this.intensity;
    this._offsetY = (Math.random() - 0.5) * 2 * this.intensity;
    if (this.timer <= 0) {
      this.intensity = 0;
      this._offsetX = 0;
      this._offsetY = 0;
    }
  }

  get offsetX(): number { return this._offsetX; }
  get offsetY(): number { return this._offsetY; }
  get active(): boolean { return this.timer > 0; }
}
