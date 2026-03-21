/**
 * Quiz Menu Scene
 */
import { SceneNode, type App } from '@lucid-2d/engine';
import { Button, Label, UIColors } from '@lucid-2d/ui';
import { QuizScene } from './quiz.js';

const W = 390, H = 844;

export class MenuScene extends SceneNode {
  constructor(private app: App) {
    super({
      id: 'menu', width: W, height: H,
      layout: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    });
  }

  onEnter() {
    this.addChild(new Label({ text: 'Quiz Game', fontSize: 40, fontWeight: 'bold', color: UIColors.primary, align: 'center', width: 300, height: 50 }));
    this.addChild(new Label({ text: 'Test your knowledge', fontSize: 16, color: UIColors.textMuted, align: 'center', width: 300, height: 24 }));

    const playBtn = new Button({ id: 'play', text: 'Start Quiz', variant: 'primary', width: 200, height: 54 });
    playBtn.$on('tap', () => this.app.router.replace(new QuizScene(this.app)));
    this.addChild(playBtn);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}
