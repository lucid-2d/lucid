/**
 * Game Scene — core gameplay
 *
 * Replace this with your game logic.
 * This example: tap the target to score points.
 */
import { UINode } from '@lucid-2d/core';
import { SceneNode, type App } from '@lucid-2d/engine';
import { Label, Button, UIColors } from '@lucid-2d/ui';
import { ResultScene } from './result.js';

const W = 390, H = 844;

/** A tappable circle target */
class Target extends UINode {
  constructor(id: string, x: number, y: number) {
    super({ id, width: 60, height: 60 });
    this.x = x;
    this.y = y;
    this.interactive = true;
    this.$on('touchstart', () => {});
    this.$on('touchend', () => this.$emit('tap'));
  }

  get $text() { return 'target'; }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = UIColors.primary;
    ctx.beginPath();
    ctx.arc(30, 30, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(30, 30, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class GameScene extends SceneNode {
  private score = 0;
  private timeLeft = 10;
  private scoreLabel!: Label;
  private timeLabel!: Label;
  private target!: Target;

  constructor(private app: App) {
    super({ id: 'game', width: W, height: H });
  }

  onEnter() {
    // HUD
    const hud = new UINode({
      id: 'hud', width: W, height: 40,
      layout: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: [8, 16, 8, 16],
    });
    this.timeLabel = new Label({ id: 'time', text: '10s', fontSize: 16, color: UIColors.text, width: 60, height: 24 });
    this.scoreLabel = new Label({ id: 'score', text: '0', fontSize: 20, fontWeight: 'bold', color: UIColors.accent, align: 'center', width: 100, height: 24 });
    hud.addChild(this.timeLabel);
    hud.addChild(this.scoreLabel);
    hud.addChild(new UINode({ width: 60, height: 24 })); // spacer
    this.addChild(hud);

    // Target
    this.target = new Target('target', W / 2 - 30, H / 2 - 30);
    this.target.$on('tap', () => this.onHit());
    this.addChild(this.target);
  }

  private onHit() {
    this.score++;
    this.scoreLabel.text = `${this.score}`;
    // Move target to random position
    this.target.x = 30 + this.app.rng.next() * (W - 90);
    this.target.y = 100 + this.app.rng.next() * (H - 250);
  }

  $update(dt: number) {
    super.$update(dt);
    this.timeLeft -= dt;
    this.timeLabel.text = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.app.router.replace(new ResultScene(this.app, this.score));
    }
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, W, H);
  }

  protected $inspectInfo(): string {
    return `score=${this.score} time=${Math.ceil(this.timeLeft)}`;
  }
}
