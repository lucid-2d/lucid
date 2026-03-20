import { UINode, type UINodeOptions } from '@lucid/core';
import { Button } from './button.js';
import { UIColors } from './tokens.js';

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

    // 内容容器（宽度 = 面板宽度，便于子组件居中计算）
    this.content = new UINode({ id: (props.id ?? '') + '-content', width: pw });
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
    this.$animate({ animScale: 0.85, animAlpha: 0 }, { duration: 150, easing: 'easeIn' });
  }

  /** 根据 content 子节点自动计算面板高度并居中 */
  fitContent(bottomPad = 24): void {
    let maxBottom = 0;
    for (const child of this.content.$children) {
      const b = child.y + child.height;
      if (b > maxBottom) maxBottom = b;
    }
    this.height = this.content.y + maxBottom + bottomPad;
    this.y = (this._screenH - this.height) / 2;
  }

  onBeforeUpdate(): void {
    if (this._closing && this.animAlpha <= 0.01) {
      this.visible = false;
      this._closing = false;
      this.$emit('close');
    }
  }

  /**
   * 重写 hitTest：Modal 可见时拦截全屏触摸（遮罩不可穿透）
   */
  hitTest(wx: number, wy: number): UINode | null {
    if (!this.visible) return null;

    // 转换为本地坐标
    const lx = wx - this.x;
    const ly = wy - this.y;

    // 先检查子节点（面板内的按钮等）
    for (let i = this.$children.length - 1; i >= 0; i--) {
      const hit = this.$children[i].hitTest(lx, ly);
      if (hit) return hit;
    }

    // 即使点击在面板外（遮罩区域），也返回自身，阻止穿透
    return this;
  }

  /**
   * 重写 $render：scale 变换需要包裹子节点，不能只在 draw 里做。
   */
  $render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const w = this.width, h = this.height;

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. 全屏遮罩
    ctx.save();
    ctx.globalAlpha = this.animAlpha * 0.65;
    ctx.fillStyle = '#000000';
    ctx.fillRect(-this.x, -this.y, this._screenW, this._screenH);
    ctx.restore();

    // 2. 面板 + 所有子节点一起 scale
    ctx.save();
    ctx.globalAlpha *= this.animAlpha;
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.animScale, this.animScale);
    ctx.translate(-cx, -cy);

    // 面板背景
    ctx.fillStyle = UIColors.panelFill;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = UIColors.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标题
    ctx.fillStyle = UIColors.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._title, w / 2, 28);

    // 子节点
    for (const child of this.$children) {
      child.$render(ctx);
    }

    ctx.restore();
    ctx.restore();
  }

  protected draw(_ctx: CanvasRenderingContext2D): void {}
}
