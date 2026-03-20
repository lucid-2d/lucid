/**
 * Menu Scene — game entry screen
 *
 * Uses layout system for automatic positioning.
 */
import { SceneNode, type App } from '@lucid/engine';
import { Button, Label, UIColors } from '@lucid/ui';
import { GameScene } from './game.js';

const W = 390, H = 844;

export class MenuScene extends SceneNode {
  constructor(private app: App) {
    super({
      id: 'menu', width: W, height: H,
      layout: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    });
  }

  onEnter() {
    this.addChild(new Label({ text: 'My Game', fontSize: 40, fontWeight: 'bold', color: UIColors.primary, align: 'center', width: 300, height: 50 }));
    this.addChild(new Label({ text: 'A Lucid game', fontSize: 16, color: UIColors.textMuted, align: 'center', width: 300, height: 24 }));

    const playBtn = new Button({ id: 'play', text: 'Play', variant: 'primary', width: 200, height: 54 });
    playBtn.$on('tap', () => this.app.router.replace(new GameScene(this.app)));
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
