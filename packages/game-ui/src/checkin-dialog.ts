import { UINode } from '@lucid/core';
import { Modal, Button, Label } from '@lucid/ui';

class DayCell extends UINode {
  private _isToday: boolean;
  private _completed: boolean;

  constructor(id: string, public day: number, public reward: number, isToday: boolean, completed: boolean) {
    super({ id, width: 36, height: 50 });
    this._isToday = isToday;
    this._completed = completed;
  }

  get $text() { return `${this.reward}`; }
  get $highlighted() { return this._isToday; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;
    // Background
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 6);
    ctx.fillStyle = this._isToday ? 'rgba(233,69,96,0.3)' : this._completed ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    if (this._isToday) {
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Day number
    ctx.fillStyle = this._completed ? '#4caf50' : this._isToday ? '#ffd166' : 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Day${this.day + 1}`, w / 2, 14);

    // Reward
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(this._completed ? '✓' : `+${this.reward}`, w / 2, 35);
  }
}

export interface CheckinDialogProps {
  rewards: number[];
  currentDay: number;
  claimed: boolean;
}

export class CheckinDialog extends Modal {
  constructor(props: CheckinDialogProps) {
    super({ title: '每日签到', id: 'checkin', width: 310, height: 280, screenWidth: 390, screenHeight: 844 });

    // Day grid
    const gridW = 270;
    const cellW = 36;
    const gap = (gridW - cellW * 7) / 6;
    for (let i = 0; i < props.rewards.length; i++) {
      const cell = new DayCell(`day-${i}`, i, props.rewards[i], i === props.currentDay, i < props.currentDay);
      cell.x = (i % 7) * (cellW + gap);
      cell.y = 0;
      this.content.addChild(cell);
    }

    // Claim button
    const claimBtn = new Button({
      id: 'claim-btn',
      text: props.claimed ? '已签到' : '签到领取',
      variant: props.claimed ? 'outline' : 'primary',
      disabled: props.claimed,
      width: 180, height: 42,
    });
    claimBtn.x = 45;
    claimBtn.y = 80;
    claimBtn.$on('tap', () => {
      this.$emit('claim', props.currentDay, props.rewards[props.currentDay]);
    });
    this.content.addChild(claimBtn);

    this.open();
  }
}
