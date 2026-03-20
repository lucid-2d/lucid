import { UINode, type UINodeOptions } from '@lucid/core';

export interface ModalProps extends UINodeOptions {
  title: string;
}

export class Modal extends UINode {
  private _title: string;
  readonly content: UINode;

  constructor(props: ModalProps) {
    super(props);
    this._title = props.title;
    this.visible = false;

    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.addChild(this.content);
  }

  get title(): string { return this._title; }
  set title(v: string) {
    this._title = v;
    this.markDirty();
  }

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
    const w = this.width || 300;
    const h = this.height || 400;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-this.x, -this.y, 9999, 9999);

    // Panel
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fillStyle = 'rgba(20,15,35,0.95)';
    ctx.fill();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._title, w / 2, 28);
  }
}
