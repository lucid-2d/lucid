/**
 * LuckyBoxDialog — 抽奖弹窗（参照 template lucky-box.ts）
 */

import { UINode } from '@lucid/core';
import { Modal, Button, Label, ProgressBar, Icon, UIColors } from '@lucid/ui';

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
    const pw = 310;
    super({ title: '幸运宝箱', id: 'lucky-box', width: pw, height: 200, screenWidth: 390, screenHeight: 844 });
    this._fragments = props.fragments;
    this._redeemCost = props.redeemCost;
    this._freeOpens = props.freeOpens;
    this._adOpens = props.adOpens;

    const btnW = 230;
    const cx = (pw - btnW) / 2; // center x for buttons

    // Gift icon
    const iconSize = 48;
    const boxIcon = new Icon({ name: 'gift', size: iconSize, color: UIColors.accent });
    boxIcon.x = (pw - iconSize) / 2; boxIcon.y = 16;
    this.content.addChild(boxIcon);

    // Fragment progress
    const fragLabel = new Label({
      text: `碎片 ${props.fragments}/${props.redeemCost}`,
      fontSize: 12, color: UIColors.textMuted, align: 'center', width: pw, height: 20,
    });
    fragLabel.x = 0; fragLabel.y = 75;
    this.content.addChild(fragLabel);

    const barW = 230;
    const fragBar = new ProgressBar({ id: 'frag-bar', width: barW, height: 8 });
    fragBar.x = (pw - barW) / 2; fragBar.y = 95;
    fragBar.value = Math.min(1, props.fragments / props.redeemCost);
    fragBar.color = UIColors.accent;
    this.content.addChild(fragBar);

    const openBtn = new Button({
      id: 'open-btn',
      text: props.freeOpens > 0 ? `免费开箱 (${props.freeOpens})` : '开箱',
      variant: 'primary',
      width: btnW, height: 42,
      disabled: props.freeOpens <= 0 && props.adOpens <= 0,
    });
    openBtn.x = cx; openBtn.y = 120;
    openBtn.$on('tap', () => this.$emit('open'));
    this.content.addChild(openBtn);

    if (props.adOpens > 0) {
      const adBtn = new Button({
        id: 'ad-open-btn',
        text: `看广告开箱 (${props.adOpens})`,
        variant: 'gold',
        width: btnW, height: 42,
      });
      adBtn.x = cx; adBtn.y = 172;
      adBtn.$on('tap', () => this.$emit('openByAd'));
      this.content.addChild(adBtn);
    }

    const canRedeem = props.fragments >= props.redeemCost;
    const redeemBtn = new Button({
      id: 'redeem-btn',
      text: canRedeem ? '碎片兑换' : `碎片不足 (${props.fragments}/${props.redeemCost})`,
      variant: canRedeem ? 'secondary' : 'outline',
      disabled: !canRedeem,
      width: btnW, height: 38,
    });
    redeemBtn.x = cx; redeemBtn.y = props.adOpens > 0 ? 224 : 172;
    redeemBtn.$on('tap', () => this.$emit('redeem'));
    this.content.addChild(redeemBtn);

    this.fitContent();
    this.open();
  }

  protected $inspectInfo(): string {
    return `frags=${this._fragments}/${this._redeemCost} free=${this._freeOpens} ad=${this._adOpens}`;
  }
}
