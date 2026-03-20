/**
 * PrivacyDialog — 隐私合规弹窗（参照 template privacy.ts）
 */

import { UINode } from '@lucid/core';
import { Modal, Button, Label } from '@lucid/ui';

export interface PrivacyDialogProps {
  title?: string;
  content?: string;
  privacyUrl?: string;
}

export class PrivacyDialog extends Modal {
  constructor(props: PrivacyDialogProps = {}) {
    super({
      title: props.title ?? '隐私保护指引',
      id: 'privacy',
      width: 300, height: 320,
      screenWidth: 390, screenHeight: 844,
      showCloseButton: false,
    });

    const desc = new Label({
      text: props.content ?? '我们重视您的隐私保护。在使用\n本游戏前，请阅读并同意隐私\n保护指引。',
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      align: 'center',
      width: 260, height: 80,
    });
    desc.x = 0; desc.y = 10;
    this.content.addChild(desc);

    // View privacy policy
    const viewBtn = new Button({
      id: 'view-privacy',
      text: '查看隐私协议',
      variant: 'outline',
      width: 200, height: 38,
    });
    viewBtn.x = 30; viewBtn.y = 100;
    viewBtn.$on('tap', () => this.$emit('viewPolicy'));
    this.content.addChild(viewBtn);

    // Agree button
    const agreeBtn = new Button({
      id: 'agree-btn',
      text: '同意并继续',
      variant: 'primary',
      width: 200, height: 42,
    });
    agreeBtn.x = 30; agreeBtn.y = 155;
    agreeBtn.$on('tap', () => {
      this.$emit('agree');
      this.close();
    });
    this.content.addChild(agreeBtn);

    this.open();
  }
}
