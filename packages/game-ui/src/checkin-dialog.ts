import { UINode } from '@lucid/core';
import { Modal, Button, Label } from '@lucid/ui';

class DayCell extends UINode {
  private _isToday: boolean;
  private _completed: boolean;

  constructor(id: string, public day: number, public reward: number, isToday: boolean, completed: boolean) {
    super({ id, width: 80, height: 80 });
    this._isToday = isToday;
    this._completed = completed;
  }

  get $text() { return `${this.reward}`; }
  get $highlighted() { return this._isToday; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fillStyle = this._isToday ? 'rgba(233,69,96,0.25)' : this._completed ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    if (this._isToday) {
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Day label
    ctx.fillStyle = this._completed ? '#4caf50' : this._isToday ? '#ffd166' : 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Day ${this.day + 1}`, w / 2, 18);

    // Coin icon
    ctx.font = '20px sans-serif';
    ctx.fillText(this._completed ? '✓' : '🪙', w / 2, 42);

    // Reward
    ctx.fillStyle = this._completed ? '#4caf50' : '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(this._completed ? '已领' : `+${this.reward}`, w / 2, 66);
  }
}

export interface CheckinDialogProps {
  rewards: number[];
  currentDay: number;
  claimed: boolean;
}

export class CheckinDialog extends Modal {
  constructor(props: CheckinDialogProps) {
    super({ title: '每日签到', id: 'checkin', width: 320, height: 420, screenWidth: 390, screenHeight: 844 });

    const cols = 3;
    const cellGap = 8;
    const gridPad = 10;
    const cellW = (280 - cellGap * (cols - 1)) / cols;
    const cellH = 80;
    const bigCardH = 64;

    const cycleDays = props.rewards.length;
    const normalDays = cycleDays - 1; // 前 6 天用 3 列网格

    // 前 6 天 (3+3)
    for (let i = 0; i < normalDays; i++) {
      const cell = new DayCell(`day-${i}`, i, props.rewards[i], i === props.currentDay, i < props.currentDay);
      cell.width = cellW;
      cell.height = cellH;
      cell.x = gridPad + (i % cols) * (cellW + cellGap);
      cell.y = Math.floor(i / cols) * (cellH + cellGap);
      this.content.addChild(cell);
    }

    // 第 7 天独占一行（大奖）
    const lastIdx = normalDays;
    const lastCell = new DayCell(`day-${lastIdx}`, lastIdx, props.rewards[lastIdx], lastIdx === props.currentDay, lastIdx < props.currentDay);
    lastCell.width = 280;
    lastCell.height = bigCardH;
    lastCell.x = gridPad;
    lastCell.y = Math.ceil(normalDays / cols) * (cellH + cellGap);
    this.content.addChild(lastCell);

    // Claim button
    const btnY = lastCell.y + bigCardH + 12;
    const claimBtn = new Button({
      id: 'claim-btn',
      text: props.claimed ? '已签到' : '签到领取',
      variant: props.claimed ? 'outline' : 'primary',
      disabled: props.claimed,
      width: 200, height: 42,
    });
    claimBtn.x = 40;
    claimBtn.y = btnY;
    claimBtn.$on('tap', () => {
      this.$emit('claim', props.currentDay, props.rewards[props.currentDay]);
    });
    this.content.addChild(claimBtn);

    this.open();
  }
}
