import { UINode } from '@lucid/core';
import { Button, Label, Icon, type ButtonVariant, type IconName } from '@lucid/ui';

class StatNode extends UINode {
  constructor(id: string, public iconName: string, public label: string, public value: string) {
    super({ id, width: 170, height: 70 });
  }
  get $text() { return `${this.label}: ${this.value}`; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    // Card background
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    // Icon (left area)
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.iconName, 28, h / 2);

    // Label + Value (right area)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.label, 52, h / 2 - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(this.value, 52, h / 2 + 12);
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
    this.interactive = true; // 阻止穿透
    this._title = props.title;
    this._score = props.score;
    this._isNewBest = props.isNewBest;

    // Close button
    const closeBtn = new Button({ id: 'close-btn', text: '×', variant: 'ghost', width: 40, height: 40 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('action', 'close'));
    this.addChild(closeBtn);

    // Title
    const titleLabel = new Label({ text: props.title, fontSize: 32, fontWeight: 'bold', color: '#ffd166', align: 'center', width: 390, height: 40 });
    titleLabel.y = 120;
    this.addChild(titleLabel);

    // Score
    const scoreLabel = new Label({ text: String(props.score), fontSize: 52, fontWeight: 'bold', color: '#ffffff', align: 'center', width: 390, height: 60 });
    scoreLabel.y = 180;
    this.addChild(scoreLabel);

    // NEW BEST
    let nextY = 260;
    if (props.isNewBest) {
      const bestLabel = new Label({ text: 'NEW BEST!', fontSize: 14, fontWeight: 'bold', color: '#e94560', align: 'center', width: 390, height: 20 });
      bestLabel.y = 250;
      this.addChild(bestLabel);
      nextY = 280;
    }

    // Stats (2-column grid)
    const gap = 10;
    const cardW = 170;
    const cardH = 70;
    props.stats.forEach((s, i) => {
      const stat = new StatNode(`stat-${i}`, s.icon, s.label, s.value);
      stat.width = cardW;
      stat.x = i % 2 === 0 ? 15 : 15 + cardW + gap;
      stat.y = nextY + Math.floor(i / 2) * (cardH + gap);
      this.addChild(stat);
    });

    // Buttons — vertical stack below stats
    const statsRows = Math.ceil(props.stats.length / 2);
    const btnStartY = nextY + statsRows * (cardH + gap) + 30;

    this._buttonContainer = new UINode({ id: 'result-buttons' });
    this._buttonContainer.y = btnStartY;
    this.addChild(this._buttonContainer);

    props.buttons.forEach((b, i) => {
      const btnW = 350;
      const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant, width: btnW, height: 44 });
      btn.x = 20;
      btn.y = i * 56;
      btn.$on('tap', () => this.$emit('action', b.id));
      this._buttonContainer.addChild(btn);
    });
  }

  addButton(b: { id: string; label: string; variant: ButtonVariant }, position?: number): void {
    const btn = new Button({ id: `btn-${b.id}`, text: b.label, variant: b.variant, width: 350, height: 44 });
    btn.x = 20;
    btn.$on('tap', () => this.$emit('action', b.id));
    this._buttonContainer.addChild(btn, position);
    // Recalculate Y positions
    this._buttonContainer.$children.forEach((child, i) => {
      (child as UINode).y = i * 56;
    });
  }

  get $text() { return this._title; }

  protected draw(ctx: CanvasRenderingContext2D): void {
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
