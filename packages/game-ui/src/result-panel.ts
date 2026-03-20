import { UINode } from '@lucid/core';
import { Button, Label, type ButtonVariant } from '@lucid/ui';

class StatNode extends UINode {
  constructor(id: string, public icon: string, public label: string, public value: string) {
    super({ id, width: 150, height: 60 });
  }
  get $text() { return `${this.label}: ${this.value}`; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 8);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, this.width / 2, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(this.value, this.width / 2, 44);
  }
}

export interface ResultPanelProps {
  title: string;
  score: number;
  isNewBest: boolean;
  stats: Array<{ icon: string; label: string; value: string }>;
  buttons: Array<{ id: string; label: string; variant: ButtonVariant }>;
  adButton?: { label: string };
}

export class ResultPanel extends UINode {
  private _title: string;
  private _score: number;
  private _isNewBest: boolean;
  private _buttonContainer: UINode;

  constructor(props: ResultPanelProps) {
    super({ id: 'result', width: 390, height: 844 });
    this._title = props.title;
    this._score = props.score;
    this._isNewBest = props.isNewBest;

    // Stats
    props.stats.forEach((s, i) => {
      this.addChild(new StatNode(`stat-${i}`, s.icon, s.label, s.value));
    });

    // Button container
    this._buttonContainer = new UINode({ id: 'result-buttons' });
    this.addChild(this._buttonContainer);

    for (const b of props.buttons) {
      this._createButton(b);
    }
  }

  private _createButton(b: { id: string; label: string; variant: ButtonVariant }): Button {
    const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant });
    btn.$on('tap', () => this.$emit('action', b.id));
    this._buttonContainer.addChild(btn);
    return btn;
  }

  addButton(b: { id: string; label: string; variant: ButtonVariant }, position?: number): void {
    const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant });
    btn.$on('tap', () => this.$emit('action', b.id));
    this._buttonContainer.addChild(btn, position);
  }

  get $text() { return this._title; }

  $inspect(depth?: number): string {
    let out = super.$inspect(depth);
    const lines = out.split('\n');
    const extra = ` score=${this._score}${this._isNewBest ? ' NEW BEST' : ''}`;
    lines[0] += extra;
    return lines.join('\n');
  }
}
