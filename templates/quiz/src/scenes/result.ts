/**
 * Quiz Result Scene
 */
import { UINode } from '@lucid-2d/core';
import { SceneNode, type App } from '@lucid-2d/engine';
import { Button, Label, UIColors } from '@lucid-2d/ui';
import { MenuScene } from './menu.js';
import { QuizScene } from './quiz.js';

const W = 390, H = 844;

export class ResultScene extends SceneNode {
  constructor(private app: App, private score: number, private total: number) {
    super({
      id: 'result', width: W, height: H,
      layout: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    });
  }

  onEnter() {
    this.addChild(new Label({ text: 'Quiz Complete!', fontSize: 32, fontWeight: 'bold', color: UIColors.accent, align: 'center', width: 300, height: 40 }));
    this.addChild(new Label({ id: 'score', text: `${this.score}`, fontSize: 56, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 300, height: 64 }));
    this.addChild(new Label({ text: `${this.total} questions`, fontSize: 16, color: UIColors.textMuted, align: 'center', width: 300, height: 24 }));

    this.addChild(new UINode({ width: 1, height: 20 }));

    const againBtn = new Button({ id: 'again', text: 'Try Again', variant: 'primary', width: 200, height: 50 });
    againBtn.$on('tap', () => this.app.router.replace(new QuizScene(this.app)));
    this.addChild(againBtn);

    const menuBtn = new Button({ id: 'menu', text: 'Menu', variant: 'outline', width: 200, height: 50 });
    menuBtn.$on('tap', () => this.app.router.replace(new MenuScene(this.app)));
    this.addChild(menuBtn);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}
