/**
 * ConfirmDialog — 确认/取消弹窗
 *
 * 按钮撑满 Modal 宽度、高度 48px、间距一致。
 *
 * ## Node IDs
 * - `confirm-dialog` — 弹窗根节点
 * - `confirm-btn` — 确认按钮
 * - `cancel-btn` — 取消按钮
 *
 * ## Events
 * - `confirm` — 点击确认
 * - `cancel` — 点击取消
 */

import { Modal, Button, Label, UIColors } from '@lucid-2d/ui';

export interface ConfirmAction {
  text?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';
  onTap: () => void;
}

export interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirm: ConfirmAction;
  cancel?: ConfirmAction;
  screenWidth?: number;
  screenHeight?: number;
}

export class ConfirmDialog extends Modal {
  constructor(props: ConfirmDialogProps) {
    const sw = props.screenWidth ?? 390;
    const sh = props.screenHeight ?? 844;
    const pw = Math.min(sw - 40, 300);
    super({
      title: props.title,
      id: 'confirm-dialog',
      width: pw,
      height: 200,
      screenWidth: sw,
      screenHeight: sh,
    });

    const btnW = pw - 48;
    const btnX = 24;
    let y = 0;

    // Optional message
    if (props.message) {
      const msg = new Label({
        id: 'confirm-message',
        text: props.message,
        fontSize: 14,
        color: UIColors.textSecondary,
        align: 'center',
        wrap: true,
        verticalAlign: 'top',
        width: btnW,
        height: 60,
      });
      msg.x = btnX;
      msg.y = y;
      this.content.addChild(msg);
      y += 68;
    }

    // Confirm button
    const confirmBtn = new Button({
      id: 'confirm-btn',
      text: props.confirm.text ?? '确认',
      variant: props.confirm.variant ?? 'primary',
      width: btnW,
      height: 48,
    });
    confirmBtn.x = btnX;
    confirmBtn.y = y;
    confirmBtn.$on('tap', () => {
      props.confirm.onTap();
      this.$emit('confirm');
    });
    this.content.addChild(confirmBtn);
    y += 60;

    // Cancel button (optional)
    if (props.cancel) {
      const cancelBtn = new Button({
        id: 'cancel-btn',
        text: props.cancel.text ?? '取消',
        variant: props.cancel.variant ?? 'secondary',
        width: btnW,
        height: 48,
      });
      cancelBtn.x = btnX;
      cancelBtn.y = y;
      cancelBtn.$on('tap', () => {
        props.cancel!.onTap();
        this.$emit('cancel');
      });
      this.content.addChild(cancelBtn);
    }

    this.fitContent();
  }
}
