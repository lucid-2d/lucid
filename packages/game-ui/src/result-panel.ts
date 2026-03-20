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

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, this.width / 2, 18);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.fillText(this.label, this.width / 2, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(this.value, this.width / 2, 52);
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

    // Close / back button
    const closeBtn = new Button({ id: 'close-btn', text: '×', variant: 'ghost', width: 40, height: 40 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('action', 'close'));
    this.addChild(closeBtn);

    // Title label
    const titleLabel = new Label({ text: props.title, fontSize: 32, fontWeight: 'bold', color: '#ffd166', align: 'center', width: 390, height: 40 });
    titleLabel.y = 160;
    this.addChild(titleLabel);

    // Score
    const scoreLabel = new Label({ text: String(props.score), fontSize: 52, fontWeight: 'bold', color: '#ffffff', align: 'center', width: 390, height: 60 });
    scoreLabel.y = 230;
    this.addChild(scoreLabel);

    if (props.isNewBest) {
      const bestLabel = new Label({ text: 'NEW BEST!', fontSize: 14, fontWeight: 'bold', color: '#e94560', align: 'center', width: 390, height: 20 });
      bestLabel.y = 295;
      this.addChild(bestLabel);
    }

    // Stats (2 column grid)
    const statsY = 340;
    const gap = 10;
    const cardW = 170;
    props.stats.forEach((s, i) => {
      const stat = new StatNode(`stat-${i}`, s.icon, s.label, s.value);
      stat.width = cardW;
      stat.x = i % 2 === 0 ? 15 : 15 + cardW + gap;
      stat.y = statsY + Math.floor(i / 2) * (70);
      this.addChild(stat);
    });

    // Buttons
    this._buttonContainer = new UINode({ id: 'result-buttons' });
    const btnY = statsY + Math.ceil(props.stats.length / 2) * 70 + 40;
    this._buttonContainer.y = btnY;
    this.addChild(this._buttonContainer);

    let bx = 0;
    for (const b of props.buttons) {
      this._createButton(b, bx);
      bx++;
    }
  }

  private _createButton(b: { id: string; label: string; variant: ButtonVariant }, index: number): void {
    const btnW = 170;
    const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant, width: btnW, height: 44 });
    btn.x = index % 2 === 0 ? 15 : 15 + btnW + 10;
    btn.y = Math.floor(index / 2) * 56;
    btn.$on('tap', () => this.$emit('action', b.id));
    this._buttonContainer.addChild(btn);
  }

  addButton(b: { id: string; label: string; variant: ButtonVariant }, position?: number): void {
    const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant, width: 350, height: 44 });
    btn.x = 20;
    btn.$on('tap', () => this.$emit('action', b.id));
    this._buttonContainer.addChild(btn, position);
  }

  get $text() { return this._title; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // Full screen background
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  $inspect(depth?: number): string {
    let out = super.$inspect(depth);
    const lines = out.split('\n');
    lines[0] += ` score=${this._score}${this._isNewBest ? ' NEW BEST' : ''}`;
    return lines.join('\n');
  }
}
