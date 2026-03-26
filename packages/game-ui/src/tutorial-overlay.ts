/**
 * TutorialOverlay — 新手引导组件
 *
 * 半透明遮罩 + 目标区域镂空高亮 + 提示气泡 + 步骤导航。
 *
 * ## 使用
 * ```typescript
 * const tutorial = showTutorial(scene, {
 *   steps: [
 *     { targetId: 'play', text: '点击开始游戏' },
 *     { targetId: 'shop', text: '这里可以购买皮肤', position: 'top' },
 *   ],
 * });
 * tutorial.$on('complete', () => storage.set('tutorialDone', true));
 * ```
 *
 * ## Events
 * - `complete` — 全部步骤完成
 * - `skip` — 用户跳过
 * - `step` — 步骤切换 (stepIndex: number)
 */

import { UINode } from '@lucid-2d/core';
import { Button, UIColors } from '@lucid-2d/ui';

export interface TutorialStep {
  /** findById() 定位目标节点 */
  targetId: string;
  /** 提示文字 */
  text: string;
  /** 提示气泡位置（默认 bottom） */
  position?: 'top' | 'bottom';
  /** 高亮区域内边距（默认 8） */
  highlightPadding?: number;
}

export interface TutorialOverlayProps {
  steps: TutorialStep[];
  screenWidth?: number;
  screenHeight?: number;
  /** 显示"跳过"按钮（默认 true） */
  allowSkip?: boolean;
}

// ── Helpers ──

function getWorldBounds(node: UINode): { x: number; y: number; w: number; h: number } {
  let x = node.x, y = node.y;
  let p = node.$parent;
  while (p) { x += p.x; y += p.y; p = p.$parent; }
  return { x, y, w: node.width, h: node.height };
}

// ── Component ──

export class TutorialOverlay extends UINode {
  private _steps: TutorialStep[];
  private _scene: UINode;
  private _allowSkip: boolean;
  private _nextBtn: Button;
  private _skipBtn: Button | null = null;

  currentStep = 0;
  readonly totalSteps: number;

  // Cached target bounds for current step
  private _targetBounds: { x: number; y: number; w: number; h: number } | null = null;

  constructor(scene: UINode, props: TutorialOverlayProps) {
    const sw = props.screenWidth ?? 390;
    const sh = props.screenHeight ?? 844;
    super({ id: 'tutorial-overlay', width: sw, height: sh });
    this._scene = scene;
    this._steps = props.steps;
    this.totalSteps = props.steps.length;
    this._allowSkip = props.allowSkip ?? true;
    this.interactive = true;

    // "下一步" button
    this._nextBtn = new Button({
      id: 'tutorial-next',
      text: '下一步',
      variant: 'primary',
      width: 100,
      height: 36,
    });
    this._nextBtn.$on('tap', () => this.nextStep());
    this.addChild(this._nextBtn);

    // "跳过" button
    if (this._allowSkip) {
      this._skipBtn = new Button({
        id: 'tutorial-skip',
        text: '跳过',
        variant: 'ghost',
        width: 60,
        height: 32,
        fontSize: 12,
      });
      this._skipBtn.x = sw - 60 - 16;
      this._skipBtn.y = sh - 48;
      this._skipBtn.$on('tap', () => this.skip());
      this.addChild(this._skipBtn);
    }

    // Touch on overlay area → advance step (clicking highlighted area)
    this.$on('touchstart', () => {});
    this.$on('touchend', () => {});

    this.updateStep();
  }

  get $text(): string {
    return `Tutorial ${this.currentStep + 1}/${this.totalSteps}`;
  }

  nextStep(): void {
    if (this.currentStep >= this.totalSteps - 1) {
      this.$emit('complete');
      this.removeFromParent();
      return;
    }
    this.currentStep++;
    this.updateStep();
    this.$emit('step', this.currentStep);
  }

  skip(): void {
    this.$emit('skip');
    this.removeFromParent();
  }

  private updateStep(): void {
    const step = this._steps[this.currentStep];
    if (!step) return;

    // Find target node
    const target = this._scene.findById(step.targetId);
    if (target) {
      this._targetBounds = getWorldBounds(target);
    } else {
      this._targetBounds = null;
    }

    // Update button text on last step
    this._nextBtn.text = this.currentStep >= this.totalSteps - 1 ? '知道了' : '下一步';

    // Position next button relative to tooltip
    this.positionTooltip();
  }

  private positionTooltip(): void {
    const step = this._steps[this.currentStep];
    if (!step || !this._targetBounds) {
      // No target — center the tooltip
      this._nextBtn.x = Math.round((this.width - 100) / 2);
      this._nextBtn.y = Math.round(this.height / 2) + 40;
      return;
    }

    const b = this._targetBounds;
    const pad = step.highlightPadding ?? 8;
    const pos = step.position ?? 'bottom';
    const tooltipH = 80;

    if (pos === 'top') {
      // Tooltip above target
      const tooltipY = b.y - pad - tooltipH - 8;
      this._nextBtn.x = Math.round((this.width - 100) / 2);
      this._nextBtn.y = tooltipY + tooltipH - 40;
    } else {
      // Tooltip below target
      const tooltipY = b.y + b.h + pad + 8;
      this._nextBtn.x = Math.round((this.width - 100) / 2);
      this._nextBtn.y = tooltipY + tooltipH - 40;
    }
  }

  hitTest(wx: number, wy: number): UINode | null {
    if (!this.visible) return null;
    const lx = wx - this.x;
    const ly = wy - this.y;

    // Check child buttons first (next, skip)
    const children = this.$children;
    for (let i = children.length - 1; i >= 0; i--) {
      const hit = children[i].hitTest(lx, ly);
      if (hit) return hit;
    }

    // Block all other touches (overlay intercepts everything)
    if (lx >= 0 && lx <= this.width && ly >= 0 && ly <= this.height) {
      return this as unknown as UINode;
    }
    return null;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const step = this._steps[this.currentStep];
    if (!step) return;

    const b = this._targetBounds;
    const pad = step.highlightPadding ?? 8;

    // ── 1. Semi-transparent overlay with cutout ──
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    if (b) {
      // Draw overlay with rectangular cutout using compositing
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 8);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // ── 2. Highlight border ──
      ctx.strokeStyle = UIColors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 8);
      ctx.stroke();
    } else {
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    // ── 3. Tooltip bubble ──
    const pos = step.position ?? 'bottom';
    const bubbleW = Math.min(w - 48, 300);
    const bubbleH = 70;
    const bubbleX = Math.round((w - bubbleW) / 2);
    let bubbleY: number;

    if (b) {
      if (pos === 'top') {
        bubbleY = b.y - pad - bubbleH - 12;
      } else {
        bubbleY = b.y + b.h + pad + 12;
      }
    } else {
      bubbleY = Math.round(h / 2) - bubbleH / 2;
    }

    // Bubble background
    ctx.fillStyle = UIColors.panelFill;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.strokeStyle = UIColors.panelBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = UIColors.text;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(step.text, bubbleX + 16, bubbleY + 14);

    // Step indicator
    ctx.fillStyle = UIColors.textSecondary;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.currentStep + 1} / ${this.totalSteps}`, bubbleX + 16, bubbleY + 38);
  }
}

/** Show a tutorial overlay on the scene */
export function showTutorial(scene: UINode, config: TutorialOverlayProps): TutorialOverlay {
  const overlay = new TutorialOverlay(scene, {
    ...config,
    screenWidth: config.screenWidth ?? scene.width,
    screenHeight: config.screenHeight ?? scene.height,
  });
  scene.addChild(overlay as unknown as UINode);
  return overlay;
}
