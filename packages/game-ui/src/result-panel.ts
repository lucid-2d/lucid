import { UINode } from '@lucid-2d/core';
import { Button, Label, UIColors, drawIcon, type ButtonVariant, type IconName } from '@lucid-2d/ui';

class StatNode extends UINode {
  constructor(id: string, public iconName: IconName, public label: string, public value: string) {
    super({ id, width: 170, height: 70 });
  }
  get $text() { return `${this.label}: ${this.value}`; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    // Card background
    ctx.fillStyle = UIColors.cardBg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    // Icon (left area) — use drawIcon instead of emoji
    drawIcon(ctx, this.iconName, 28, h / 2, 22, UIColors.accent);

    // Label + Value (right area)
    ctx.fillStyle = UIColors.textMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, 52, h / 2 - 10);

    ctx.fillStyle = UIColors.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(this.value, 52, h / 2 + 12);
  }
}

export interface ResultPanelProps {
  title: string;
  score: number;
  isNewBest: boolean;
  stats: Array<{ icon: IconName; label: string; value: string }>;
  buttons: Array<{ id: string; label: string; variant: ButtonVariant }>;
  adButton?: { label: string };
}

/**
 * ResultPanel — 游戏结算面板
 *
 * ## Node IDs (stable, for testing)
 * - `result` — panel root
 * - `close-btn` — 关闭按钮
 * - `stat-{index}` — 统计卡片（从 0 开始）
 * - `btn-{id}` — 操作按钮（id 来自 props.buttons[].id）
 * - `result-buttons` — 按钮容器
 *
 * ## Events
 * - `action(buttonId: string)` — 按钮被点击，buttonId 来自 props.buttons[].id
 *   - 关闭按钮: `action('close')`
 *   - 自定义按钮: `action(button.id)`
 *
 * ## Testing
 * ```typescript
 * const panel = new ResultPanel({ ..., buttons: [{ id: 'again', label: '再来', variant: 'primary' }] });
 * // 查找按钮: findById('btn-again') 或 $query('Button')
 * // 监听事件: panel.$on('action', (id) => { if (id === 'again') ... })
 * ```
 */
export class ResultPanel extends UINode {
  private _title: string;
  private _score: number;
  private _isNewBest: boolean;
  private _buttonContainer: UINode;

  constructor(props: ResultPanelProps) {
    super({ id: 'result', width: 390, height: 844 });
    this.interactive = true;
    this._title = props.title;
    this._score = props.score;
    this._isNewBest = props.isNewBest;

    // Close button
    const closeBtn = new Button({ id: 'close-btn', text: '×', variant: 'ghost', width: 40, height: 40 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('action', 'close'));
    this.addChild(closeBtn);

    // Title
    const titleLabel = new Label({ text: props.title, fontSize: 32, fontWeight: 'bold', color: UIColors.accent, align: 'center', width: 390, height: 40 });
    titleLabel.y = 120;
    this.addChild(titleLabel);

    // Score
    const scoreLabel = new Label({ text: String(props.score), fontSize: 52, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 390, height: 60 });
    scoreLabel.y = 180;
    this.addChild(scoreLabel);

    // NEW BEST
    let nextY = 260;
    if (props.isNewBest) {
      const bestLabel = new Label({ text: 'NEW BEST!', fontSize: 14, fontWeight: 'bold', color: UIColors.primary, align: 'center', width: 390, height: 20 });
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

    // Buttons
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
    this._buttonContainer.$children.forEach((child, i) => {
      (child as UINode).y = i * 56;
    });
  }

  get $text() { return this._title; }
  protected $inspectInfo(): string {
    return `score=${this._score}${this._isNewBest ? ' newBest' : ''}`;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

}
