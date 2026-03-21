/**
 * PrivacyDialog — 隐私合规弹窗（参照 template privacy.ts）
 */

import { UINode } from '@lucid-2d/core';
import { Modal, Button, Label, UIColors } from '@lucid-2d/ui';

export interface PrivacyDialogProps {
  title?: string;
  content?: string;
  privacyUrl?: string;
}

export class PrivacyDialog extends Modal {
  constructor(props: PrivacyDialogProps = {}) {
    const pw = 300;
    super({
      title: props.title ?? '隐私保护指引',
      id: 'privacy',
      width: pw, height: 200,
      screenWidth: 390, screenHeight: 844,
      showCloseButton: false,
    });

    const descW = 260;
    const desc = new Label({
      text: props.content ?? '我们重视您的隐私保护。在使用\n本游戏前，请阅读并同意隐私\n保护指引。',
      fontSize: 13,
      color: UIColors.textMuted,
      align: 'center',
      width: descW, height: 80,
    });
    desc.x = (pw - descW) / 2; desc.y = 10;
    this.content.addChild(desc);

    const btnW = 200;
    const btnX = (pw - btnW) / 2;

    const viewBtn = new Button({
      id: 'view-privacy',
      text: '查看隐私协议',
      variant: 'outline',
      width: btnW, height: 38,
    });
    viewBtn.x = btnX; viewBtn.y = 100;
    viewBtn.$on('tap', () => this.$emit('viewPolicy'));
    this.content.addChild(viewBtn);

    const agreeBtn = new Button({
      id: 'agree-btn',
      text: '同意并继续',
      variant: 'primary',
      width: btnW, height: 42,
    });
    agreeBtn.x = btnX; agreeBtn.y = 155;
    agreeBtn.$on('tap', () => {
      this.$emit('agree');
      this.close();
    });
    this.content.addChild(agreeBtn);

    this.fitContent();
    this.open();
  }
}
