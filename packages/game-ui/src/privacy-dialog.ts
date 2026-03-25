/**
 * PrivacyPage — 全屏隐私协议页面（ScrollView 长文本 + 同意按钮）
 *
 * 替代原来的 PrivacyDialog Modal 弹窗，支持真实隐私合规需求。
 */

import { UINode } from '@lucid-2d/core';
import { Button, Label, ScrollView, UIColors } from '@lucid-2d/ui';

export interface PrivacyDialogProps {
  title?: string;
  content?: string;
  screenWidth?: number;
  screenHeight?: number;
  showViewButton?: boolean;
}

/**
 * PrivacyPage — 全屏隐私协议页面
 *
 * ## Node IDs
 * - `privacy-page` — 页面根节点
 * - `privacy-back` — 返回按钮
 * - `privacy-scroll` — 滚动区域
 * - `agree-btn` — 同意按钮
 *
 * ## Events
 * - `agree` — 点击同意按钮
 * - `back` — 点击返回按钮
 * - `viewPolicy` — 点击查看隐私协议链接（如果 showViewButton）
 */
export class PrivacyPage extends UINode {
  static readonly __template = true;

  // SceneNode lifecycle stubs (PrivacyPage is pushed to router as a scene)
  preload(): void {}
  onEnter(): void {}
  onExit(): void {}
  onPause(): void {}
  onResume(): void {}

  constructor(props: PrivacyDialogProps = {}) {
    const w = props.screenWidth ?? 390;
    const h = props.screenHeight ?? 844;
    super({ id: 'privacy-page', width: w, height: h });

    const title = props.title ?? '隐私保护指引';
    const content = props.content ?? '我们重视您的隐私保护。在使用本游戏前，请阅读并同意隐私保护指引。';

    // ── Title ──
    const titleLabel = new Label({
      id: 'privacy-title',
      text: title,
      fontSize: 20,
      fontWeight: 'bold',
      color: UIColors.text,
      align: 'center',
      width: w,
      height: 30,
    });
    titleLabel.y = 56;
    this.addChild(titleLabel);

    // ── Back button ──
    const backBtn = new Button({
      id: 'privacy-back',
      text: '← 返回',
      variant: 'ghost',
      width: 80,
      height: 44,
    });
    backBtn.x = 8;
    backBtn.y = 44;
    backBtn.$on('tap', () => this.$emit('back'));
    this.addChild(backBtn);

    // ── ScrollView with content ──
    const scrollY = 100;
    const btnAreaH = 80;
    const scrollH = h - scrollY - btnAreaH;
    const textW = w - 48;

    const scroll = new ScrollView({ id: 'privacy-scroll', width: w - 16, height: scrollH });
    scroll.x = 8;
    scroll.y = scrollY;

    // Estimate text height based on content length
    const fontSize = 14;
    const lineH = fontSize * 1.8;
    const avgCharW = fontSize; // CJK chars ~= fontSize width
    const charsPerLine = Math.max(1, Math.floor(textW / avgCharW));
    const manualBreaks = (content.match(/\n/g) || []).length;
    const wrappedLines = Math.ceil(content.replace(/\n/g, '').length / charsPerLine);
    const totalLines = wrappedLines + manualBreaks;
    const estimatedTextH = Math.ceil(totalLines * lineH) + 16;

    const textLabel = new Label({
      id: 'privacy-content',
      text: content,
      fontSize,
      color: UIColors.textLight,
      align: 'left',
      wrap: true,
      lineHeight: 1.8,
      verticalAlign: 'top',
      width: textW,
      height: estimatedTextH,
    });
    textLabel.x = 16;
    textLabel.y = 8;
    scroll.content.addChild(textLabel);

    scroll.contentHeight = estimatedTextH + 24;
    this.addChild(scroll);

    // ── Bottom buttons ──
    const btnW = 200;
    const btnX = Math.round((w - btnW) / 2);
    const btnY = h - btnAreaH + 10;

    if (props.showViewButton) {
      const viewBtn = new Button({
        id: 'view-privacy',
        text: '查看完整协议',
        variant: 'ghost',
        width: btnW,
        height: 44,
      });
      viewBtn.x = btnX;
      viewBtn.y = btnY - 50;
      viewBtn.$on('tap', () => this.$emit('viewPolicy'));
      this.addChild(viewBtn);
    }

    const agreeBtn = new Button({
      id: 'agree-btn',
      text: '同意并继续',
      variant: 'primary',
      width: btnW,
      height: 48,
    });
    agreeBtn.x = btnX;
    agreeBtn.y = btnY;
    agreeBtn.$on('tap', () => this.$emit('agree'));
    this.addChild(agreeBtn);
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // Full-screen background
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

/** @deprecated Use PrivacyPage instead */
export const PrivacyDialog = PrivacyPage;
