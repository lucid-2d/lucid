/**
 * Quiz Scene — question display + option selection
 *
 * Demonstrates: Layout system, UINode option buttons, $inspect for AI visibility.
 * Each option is a UINode child — AI can see and tap them via findById/emit.
 */
import { UINode } from '@lucid/core';
import { SceneNode, type App } from '@lucid/engine';
import { Label, ProgressBar, UIColors } from '@lucid/ui';
import { QUESTIONS, type Question } from '../questions.js';
import { ResultScene } from './result.js';

const W = 390, H = 844;
const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 8000; // ms

/** Option button — UINode child, AI-visible and tappable */
class OptionButton extends UINode {
  state: 'idle' | 'correct' | 'wrong' = 'idle';

  constructor(public index: number, public optText: string) {
    super({ id: `opt-${index}`, width: W - 64, height: 52 });
    this.interactive = true;
    this.$on('touchstart', () => {});
    this.$on('touchend', () => this.$emit('tap'));
  }

  get $text() { return this.optText; }
  get $highlighted() { return this.state !== 'idle'; }

  protected draw(ctx: CanvasRenderingContext2D) {
    const w = this.width, h = this.height;
    const bg = this.state === 'correct' ? '#4caf50'
             : this.state === 'wrong' ? '#f44336'
             : '#2a2a4e';
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.optText, w / 2, h / 2);
  }
}

export class QuizScene extends SceneNode {
  private questions: Question[] = [];
  private current = 0;
  private score = 0;
  private answered = false;
  private elapsed = 0;

  private questionLabel!: Label;
  private progressLabel!: Label;
  private scoreLabel!: Label;
  private timeBar!: ProgressBar;
  private optionContainer!: UINode;

  constructor(private app: App) {
    super({ id: 'quiz', width: W, height: H });
  }

  onEnter() {
    // Pick random questions
    const shuffled = [...QUESTIONS].sort(() => this.app.rng.next() - 0.5);
    this.questions = shuffled.slice(0, TOTAL_QUESTIONS);

    // HUD
    const hud = new UINode({
      id: 'hud', width: W, height: 36,
      layout: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: [0, 16, 0, 16],
    });
    this.progressLabel = new Label({ id: 'progress', text: '1/' + TOTAL_QUESTIONS, fontSize: 14, color: UIColors.textMuted, width: 60, height: 20 });
    this.scoreLabel = new Label({ id: 'score', text: '0', fontSize: 18, fontWeight: 'bold', color: UIColors.accent, align: 'center', width: 80, height: 20 });
    hud.addChild(this.progressLabel);
    hud.addChild(this.scoreLabel);
    hud.addChild(new UINode({ width: 60, height: 20 }));
    hud.y = 12;
    this.addChild(hud);

    // Question text
    this.questionLabel = new Label({
      id: 'question', text: '', fontSize: 24, fontWeight: 'bold',
      color: UIColors.text, align: 'center', width: W - 48, height: 80,
    });
    this.questionLabel.x = 24;
    this.questionLabel.y = H * 0.2;
    this.addChild(this.questionLabel);

    // Options container — column layout
    this.optionContainer = new UINode({
      id: 'options', width: W,
      layout: 'column', alignItems: 'center', gap: 12,
    });
    this.optionContainer.y = H * 0.45;
    this.addChild(this.optionContainer);

    // Time bar
    this.timeBar = new ProgressBar({ id: 'time-bar', width: W, height: 4 });
    this.timeBar.y = H - 4;
    this.addChild(this.timeBar);

    this.showQuestion();
  }

  private showQuestion() {
    const q = this.questions[this.current];
    this.questionLabel.text = q.text;
    this.progressLabel.text = `${this.current + 1}/${TOTAL_QUESTIONS}`;
    this.answered = false;
    this.elapsed = 0;
    this.timeBar.value = 1;
    this.timeBar.color = UIColors.success;

    // Clear old options
    for (const child of [...this.optionContainer.$children]) {
      this.optionContainer.removeChild(child);
    }

    // Create new options
    for (let i = 0; i < q.options.length; i++) {
      const opt = new OptionButton(i, q.options[i]);
      opt.$on('tap', () => this.selectOption(i));
      this.optionContainer.addChild(opt);
    }
  }

  private selectOption(index: number) {
    if (this.answered) return;
    this.answered = true;

    const q = this.questions[this.current];
    const correct = index === q.correct;

    if (correct) {
      this.score += Math.round(100 * (1 - this.elapsed / TIME_PER_QUESTION));
      this.scoreLabel.text = `${this.score}`;
    }

    // Show correct/wrong
    for (const child of this.optionContainer.$children) {
      if (child instanceof OptionButton) {
        if (child.index === q.correct) child.state = 'correct';
        else if (child.index === index) child.state = 'wrong';
      }
    }

    // Advance after delay
    setTimeout(() => this.nextQuestion(), 800);
  }

  private nextQuestion() {
    this.current++;
    if (this.current >= this.questions.length) {
      this.app.router.replace(new ResultScene(this.app, this.score, this.current));
    } else {
      this.showQuestion();
    }
  }

  $update(dt: number) {
    super.$update(dt);
    if (!this.answered) {
      this.elapsed += dt * 1000;
      const ratio = Math.max(0, 1 - this.elapsed / TIME_PER_QUESTION);
      this.timeBar.value = ratio;
      this.timeBar.color = ratio > 0.3 ? UIColors.success : ratio > 0.1 ? '#ff9800' : '#f44336';

      if (this.elapsed >= TIME_PER_QUESTION) {
        this.selectOption(-1); // timeout
      }
    }
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, W, H);
  }

  protected $inspectInfo(): string {
    return `q=${this.current + 1}/${TOTAL_QUESTIONS} score=${this.score}`;
  }
}
