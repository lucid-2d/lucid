/**
 * BattlePassPanel — 战令面板（参照 template battle-pass.ts）
 */

import { UINode } from '@lucid-2d/core';
import { Button, Label, ProgressBar, ScrollView, UIColors, drawIcon } from '@lucid-2d/ui';

export interface BattlePassReward {
  level: number;
  freeReward?: { icon: string; label: string };
  paidReward?: { icon: string; label: string };
  freeClaimed?: boolean;
  paidClaimed?: boolean;
}

export interface BattlePassPanelProps {
  currentLevel: number;
  currentXP: number;
  xpToNext: number;
  isPremium: boolean;
  rewards: BattlePassReward[];
  seasonName?: string;
}

class RewardRow extends UINode {
  constructor(id: string, public reward: BattlePassReward, public current: number, public isPremium: boolean) {
    super({ id, width: 350, height: 64 });
    this.interactive = true;
    this.$on('touchend', () => this.$emit('tap'));
  }

  get $text() { return `Lv.${this.reward.level}`; }
  get $highlighted() { return this.reward.level === this.current; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;
    const isReached = this.reward.level <= this.current;
    const isCurrent = this.reward.level === this.current;

    ctx.fillStyle = isCurrent ? 'rgba(255,209,102,0.1)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 6);
    ctx.fill();
    if (isCurrent) {
      ctx.strokeStyle = 'rgba(255,209,102,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Level number
    ctx.fillStyle = isReached ? UIColors.accent : UIColors.textMuted;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.reward.level}`, 24, h / 2);

    // Free reward
    if (this.reward.freeReward) {
      const fx = 60;
      ctx.fillStyle = this.reward.freeClaimed ? 'rgba(76,175,80,0.2)' : isReached ? UIColors.trackBg : 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(fx, 6, 120, h - 12, 6);
      ctx.fill();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.reward.freeReward.icon, fx + 24, h / 2);
      ctx.fillStyle = this.reward.freeClaimed ? UIColors.success : UIColors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.reward.freeClaimed ? '已领' : this.reward.freeReward.label, fx + 44, h / 2);
    }

    // Paid reward
    if (this.reward.paidReward) {
      const px = 195;
      const locked = !this.isPremium;
      ctx.fillStyle = locked ? 'rgba(255,255,255,0.02)' : this.reward.paidClaimed ? 'rgba(76,175,80,0.2)' : isReached ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(px, 6, 140, h - 12, 6);
      ctx.fill();
      if (locked) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (locked) {
        // Lock icon instead of emoji
        drawIcon(ctx, 'lock', px + 24, h / 2, 16, UIColors.textHint);
      } else {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.reward.paidReward.icon, px + 24, h / 2);
      }
      ctx.fillStyle = locked ? UIColors.textHint : this.reward.paidClaimed ? UIColors.success : UIColors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.reward.paidClaimed ? '已领' : this.reward.paidReward.label, px + 44, h / 2);
    }

    // Divider
    ctx.strokeStyle = UIColors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, h - 0.5);
    ctx.lineTo(w - 8, h - 0.5);
    ctx.stroke();
  }
}

export class BattlePassPanel extends UINode {
  private _level: number;
  private _xp: number;
  private _premium: boolean;

  get $text() { return `Lv.${this._level}`; }
  protected $inspectInfo(): string {
    return `xp=${this._xp}${this._premium ? ' premium' : ''}`;
  }

  constructor(props: BattlePassPanelProps) {
    super({ id: 'battle-pass', width: 390, height: 844 });
    this.interactive = true;
    this._level = props.currentLevel;
    this._xp = props.currentXP;
    this._premium = props.isPremium;

    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 36 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    const title = new Label({ text: props.seasonName ?? '战斗通行证', fontSize: 18, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    const levelLabel = new Label({ text: `Lv.${props.currentLevel}`, fontSize: 24, fontWeight: 'bold', color: UIColors.accent, align: 'center', width: 390, height: 30 });
    levelLabel.y = 56;
    this.addChild(levelLabel);

    const xpBar = new ProgressBar({ width: 300, height: 10 });
    xpBar.x = 45; xpBar.y = 94;
    xpBar.value = props.xpToNext > 0 ? props.currentXP / props.xpToNext : 1;
    xpBar.color = UIColors.accent;
    this.addChild(xpBar);

    const xpLabel = new Label({ text: `${props.currentXP} / ${props.xpToNext} XP`, fontSize: 11, color: UIColors.textMuted, align: 'center', width: 390, height: 16 });
    xpLabel.y = 108;
    this.addChild(xpLabel);

    const freeHeader = new Label({ text: '免费', fontSize: 12, fontWeight: 'bold', color: UIColors.textMuted, align: 'center', width: 120, height: 20 });
    freeHeader.x = 60; freeHeader.y = 132;
    this.addChild(freeHeader);

    // Paid header with lock/check icon
    const paidText = props.isPremium ? '付费 ✓' : '付费';
    const paidHeader = new Label({ text: paidText, fontSize: 12, fontWeight: 'bold', color: props.isPremium ? UIColors.goldStart : UIColors.textHint, align: 'center', width: 140, height: 20 });
    paidHeader.x = 195; paidHeader.y = 132;
    this.addChild(paidHeader);

    const listContainer = new UINode({ id: 'reward-list' });
    listContainer.y = 158;
    this.addChild(listContainer);

    props.rewards.forEach((r, i) => {
      const row = new RewardRow(`reward-${i}`, r, props.currentLevel, props.isPremium);
      row.x = 20;
      row.y = i * 68;
      row.$on('tap', () => {
        if (r.level <= props.currentLevel) {
          if (r.freeReward && !r.freeClaimed) this.$emit('claimReward', r.level, 'free');
          else if (r.paidReward && !r.paidClaimed && props.isPremium) this.$emit('claimReward', r.level, 'paid');
        }
      });
      listContainer.addChild(row);
    });

    if (!props.isPremium) {
      const buyBtn = new Button({ id: 'buy-premium', text: '解锁付费轨 ¥30', variant: 'gold', width: 220, height: 44 });
      buyBtn.x = 85; buyBtn.y = 158 + props.rewards.length * 68 + 16;
      buyBtn.$on('tap', () => this.$emit('buyPremium'));
      this.addChild(buyBtn);
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
