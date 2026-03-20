import { UINode, type UINodeOptions } from '@lucid/core';
import { Button } from './button.js';

export interface ModalProps extends UINodeOptions {
  title: string;
  screenWidth?: number;
  screenHeight?: number;
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

export class Modal extends UINode {
  private _title: string;
  readonly content: UINode;
  private _screenW: number;
  private _screenH: number;
  private _closing = false;

  /** 动画属性（$animate 驱动） */
  animScale = 0.85;
  animAlpha = 0;

  constructor(props: ModalProps) {
    const sw = props.screenWidth ?? 390;
    const sh = props.screenHeight ?? 844;
    const pw = props.width ?? Math.min(sw - 40, 320);
    const ph = props.height ?? 400;
    super({ ...props, width: pw, height: ph, x: props.x ?? (sw - pw) / 2, y: props.y ?? (sh - ph) / 2 });
    this._title = props.title;
    this._screenW = sw;
    this._screenH = sh;
    this.visible = false;
    this.interactive = true;

    // 关闭按钮
    if (props.showCloseButton !== false) {
      const closeBtn = new Button({ id: 'modal-close', text: '×', variant: 'ghost', width: 32, height: 32 });
      closeBtn.x = pw - 36;
      closeBtn.y = 6;
      closeBtn.$on('tap', () => this.close());
      this.addChild(closeBtn);
    }

    // 内容容器
    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.content.y = 50;
    this.addChild(this.content);
  }

  get title(): string { return this._title; }
  set title(v: string) { this._title = v; this.markDirty(); }
  get $text() { return this._title; }

  open(): void {
    this.visible = true;
    this._closing = false;
    this.animScale = 0.85;
    this.animAlpha = 0;
    this.$animate({ animScale: 1, animAlpha: 1 }, { duration: 200, easing: 'easeOutBack' });
    this.$emit('open');
  }

  close(): void {
    if (this._closing) return;
    this._closing = true;
    this.$animate({ animScale: 0.85, animAlpha: 0 }, { duration: 150, easing: 'easeIn' })
      .finished.then(() => {
        this.visible = false;
        this._closing = false;
        this.$emit('close');
      });
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    // 全屏遮罩
    ctx.save();
    ctx.globalAlpha = this.animAlpha * 0.65;
    ctx.fillStyle = '#000000';
    ctx.fillRect(-this.x, -this.y, this._screenW, this._screenH);
    ctx.restore();

    // 面板（缩放 + 透明度动画）
    ctx.save();
    ctx.globalAlpha *= this.animAlpha;
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.animScale, this.animScale);
    ctx.translate(-cx, -cy);

    // 面板背景
    ctx.fillStyle = 'rgba(20, 15, 35, 0.97)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._title, w / 2, 28);

    ctx.restore();
  }
}
