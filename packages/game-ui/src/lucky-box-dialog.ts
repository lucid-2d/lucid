/**
 * LuckyBoxDialog — 抽奖弹窗（参照 template lucky-box.ts）
 *
 * 开箱动画 + 免费/广告次数 + 碎片兑换
 */

import { UINode } from '@lucid/core';
import { Modal, Button, Label, ProgressBar } from '@lucid/ui';

export interface LuckyBoxDialogProps {
  fragments: number;
  redeemCost: number;
  freeOpens: number;
  adOpens: number;
}

export class LuckyBoxDialog extends Modal {
  private _fragments: number;
  private _redeemCost: number;
  private _freeOpens: number;
  private _adOpens: number;

  constructor(props: LuckyBoxDialogProps) {
    super({ title: '幸运宝箱', id: 'lucky-box', width: 310, height: 380, screenWidth: 390, screenHeight: 844 });
    this._fragments = props.fragments;
    this._redeemCost = props.redeemCost;
    this._freeOpens = props.freeOpens;
    this._adOpens = props.adOpens;

    // Box icon
    const boxIcon = new Label({ text: '🎁', fontSize: 48, align: 'center', width: 270, height: 60 });
    boxIcon.x = 0; boxIcon.y = 10;
    this.content.addChild(boxIcon);

    // Fragment progress
    const fragLabel = new Label({
      text: `碎片 ${props.fragments}/${props.redeemCost}`,
      fontSize: 12, color: 'rgba(255,255,255,0.5)', align: 'center', width: 270, height: 20,
    });
    fragLabel.x = 0; fragLabel.y = 75;
    this.content.addChild(fragLabel);

    const fragBar = new ProgressBar({ id: 'frag-bar', width: 230, height: 8 });
    fragBar.x = 20; fragBar.y = 95;
    fragBar.value = Math.min(1, props.fragments / props.redeemCost);
    fragBar.color = '#ffd166';
    this.content.addChild(fragBar);

    // Open button (free)
    const openBtn = new Button({
      id: 'open-btn',
      text: props.freeOpens > 0 ? `免费开箱 (${props.freeOpens})` : '开箱',
      variant: 'primary',
      width: 230, height: 42,
      disabled: props.freeOpens <= 0 && props.adOpens <= 0,
    });
    openBtn.x = 20; openBtn.y = 120;
    openBtn.$on('tap', () => this.$emit('open'));
    this.content.addChild(openBtn);

    // Ad open button
    if (props.adOpens > 0) {
      const adBtn = new Button({
        id: 'ad-open-btn',
        text: `看广告开箱 (${props.adOpens})`,
        variant: 'gold',
        width: 230, height: 42,
      });
      adBtn.x = 20; adBtn.y = 172;
      adBtn.$on('tap', () => this.$emit('openByAd'));
      this.content.addChild(adBtn);
    }

    // Redeem button
    const canRedeem = props.fragments >= props.redeemCost;
    const redeemBtn = new Button({
      id: 'redeem-btn',
      text: canRedeem ? '碎片兑换' : `碎片不足 (${props.fragments}/${props.redeemCost})`,
      variant: canRedeem ? 'secondary' : 'outline',
      disabled: !canRedeem,
      width: 230, height: 38,
    });
    redeemBtn.x = 20; redeemBtn.y = props.adOpens > 0 ? 224 : 172;
    redeemBtn.$on('tap', () => this.$emit('redeem'));
    this.content.addChild(redeemBtn);

    this.open();
  }
}
