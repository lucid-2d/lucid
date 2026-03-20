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

  constructor(props: TabBarProps) {
    super({ ...props, height: props.height ?? 40 });
    this.tabs = props.tabs;
    this._activeKey = props.activeKey;
    this.interactive = true;
  }

  get activeKey(): string { return this._activeKey; }
  set activeKey(key: string) {
    if (this._activeKey === key) return;
    this._activeKey = key;
    this.$emit('change', key);
    this.markDirty();
  }

  /** $inspect 显示 active tab */
  $inspect(depth?: number): string {
    const base = super.$inspect(depth);
    const first = base.split('\n')[0];
    return first + ` active="${this._activeKey}"` +
      (depth === 0 ? '' : '\n' + base.split('\n').slice(1).join('\n')).replace(/\n$/, '');
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
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

      if (isActive) {
        const textW = ctx.measureText(tab.label).width;
        ctx.beginPath();
        ctx.moveTo(cx - textW / 2 - 4, h - 2);
        ctx.lineTo(cx + textW / 2 + 4, h - 2);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  }
}
