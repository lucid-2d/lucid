import { UINode, type UINodeOptions } from '@lucid/core';

export interface TabItem {
  key: string;
  label: string;
}

export interface TabBarProps extends UINodeOptions {
  tabs: TabItem[];
  activeKey: string;
}

export class TabBar extends UINode {
  tabs: TabItem[];
  private _activeKey: string;

  /** 下划线动画当前 X（本地坐标） */
  lineX = 0;
  /** 下划线动画当前宽度 */
  lineW = 0;
  private _initialized = false;

  constructor(props: TabBarProps) {
    super({ ...props, height: props.height ?? 40 });
    this.tabs = props.tabs;
    this._activeKey = props.activeKey;
    this.interactive = true;

    // 触摸处理：判断点了哪个 tab
    this.$on('touchend', (e: any) => {
      const tabW = this.width / this.tabs.length;
      const idx = Math.floor(e.localX / tabW);
      if (idx >= 0 && idx < this.tabs.length) {
        const key = this.tabs[idx].key;
        if (key !== this._activeKey) {
          this.activeKey = key;
        }
      }
    });
  }

  get activeKey(): string { return this._activeKey; }
  set activeKey(key: string) {
    if (this._activeKey === key) return;
    this._activeKey = key;
    this.$emit('change', key);
    this._animateLine();
    this.markDirty();
  }

  private _animateLine(): void {
    const target = this._computeLineTarget();
    this.$animate({ lineX: target.x, lineW: target.w }, { duration: 200, easing: 'easeOut' });
  }

  private _computeLineTarget(): { x: number; w: number } {
    const tabW = this.width / this.tabs.length;
    const idx = this.tabs.findIndex(t => t.key === this._activeKey);
    if (idx < 0) return { x: 0, w: 0 };
    // 下划线宽度 = tab 宽度的 60%，居中
    const lw = tabW * 0.6;
    const lx = idx * tabW + (tabW - lw) / 2;
    return { x: lx, w: lw };
  }

  /** $inspect 显示 active tab */
  $inspect(depth?: number): string {
    const base = super.$inspect(depth);
    const first = base.split('\n')[0];
    return first + ` active="${this._activeKey}"` +
      (depth === 0 ? '' : '\n' + base.split('\n').slice(1).join('\n')).replace(/\n$/, '');
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // 首次渲染：跳过动画，直接跳到目标位置
    if (!this._initialized) {
      const target = this._computeLineTarget();
      this.lineX = target.x;
      this.lineW = target.w;
      this._initialized = true;
    }

    const w = this.width;
    const h = this.height;
    const tabW = w / this.tabs.length;

    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const isActive = tab.key === this._activeKey;
      const cx = i * tabW + tabW / 2;

      ctx.font = `${isActive ? 'bold ' : ''}14px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.fillText(tab.label, cx, h / 2);
    }

    // 下划线（动画位置）
    if (this.lineW > 0) {
      ctx.beginPath();
      ctx.moveTo(this.lineX, h - 2);
      ctx.lineTo(this.lineX + this.lineW, h - 2);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
}
