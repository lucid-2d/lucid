import { UINode, type UINodeOptions } from '@lucid/core';
import { Button } from './button.js';

export interface ModalProps extends UINodeOptions {
  title: string;
  /** 屏幕宽度（用于遮罩全屏），默认 390 */
  screenWidth?: number;
  /** 屏幕高度，默认 844 */
  screenHeight?: number;
}

export class Modal extends UINode {
  private _title: string;
  readonly content: UINode;
  private _screenW: number;
  private _screenH: number;
  private _closeBtn: Button;

  constructor(props: ModalProps) {
    const sw = props.screenWidth ?? 390;
    const sh = props.screenHeight ?? 844;
    const pw = props.width ?? Math.min(sw - 40, 320);
    const ph = props.height ?? 400;
    // 居中定位
    super({ ...props, width: pw, height: ph, x: props.x ?? (sw - pw) / 2, y: props.y ?? (sh - ph) / 2 });
    this._title = props.title;
    this._screenW = sw;
    this._screenH = sh;
    this.visible = false;
    // Modal 拦截所有触摸（遮罩不穿透）
    this.interactive = true;

    // 关闭按钮
    this._closeBtn = new Button({ id: 'modal-close', text: '×', variant: 'ghost', width: 32, height: 32 });
    this._closeBtn.x = pw - 36;
    this._closeBtn.y = 6;
    this._closeBtn.$on('tap', () => this.close());
    this.addChild(this._closeBtn);

    // 内容容器（标题下方）
    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.content.y = 50;
    this.addChild(this.content);
  }

  get title(): string { return this._title; }
  set title(v: string) { this._title = v; this.markDirty(); }
  get $text() { return this._title; }

  open(): void {
    this.visible = true;
    this.$emit('open');
  }

  close(): void {
    this.visible = false;
    this.$emit('close');
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    // 全屏遮罩（需要反向偏移到屏幕原点）
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-this.x, -this.y, this._screenW, this._screenH);

    // 面板背景
    ctx.fillStyle = 'rgba(20, 15, 35, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._title, w / 2, 28);
  }
}
