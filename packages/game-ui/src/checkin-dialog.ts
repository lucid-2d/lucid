import { UINode } from '@lucid/core';
import { Modal, Button, Label } from '@lucid/ui';

class DayCell extends UINode {
  private _isToday: boolean;
  private _completed: boolean;

  constructor(id: string, public day: number, public reward: number, isToday: boolean, completed: boolean) {
    super({ id });
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

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Day label
    ctx.fillStyle = this._completed ? '#4caf50' : this._isToday ? '#ffd166' : 'rgba(255,255,255,0.5)';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Day${this.day + 1}`, w / 2, h * 0.22);

    // Icon
    ctx.font = `${Math.min(w * 0.3, 18)}px sans-serif`;
    ctx.fillText(this._completed ? '✅' : '🪙', w / 2, h * 0.5);

    // Reward
    ctx.fillStyle = this._completed ? 'rgba(76,175,80,0.6)' : '#ffffff';
    ctx.font = `bold ${Math.min(w * 0.16, 13)}px sans-serif`;
    ctx.fillText(this._completed ? '已领' : `+${this.reward}`, w / 2, h * 0.8);
  }
}

export interface CheckinDialogProps {
  rewards: number[];
  currentDay: number;
  claimed: boolean;
}

export class CheckinDialog extends Modal {
  constructor(props: CheckinDialogProps) {
    const cols = 3;
    const cellGap = 8;
    const gridPad = 8;
    const panelW = 300;
    const contentW = panelW - 40; // modal content area (20px padding each side)
    const cellW = (contentW - cellGap * (cols - 1)) / cols;
    const cellH = 72;
    const bigCardH = 56;
    const cycleDays = props.rewards.length;
    const normalDays = cycleDays - 1;
    const rows = Math.ceil(normalDays / cols);

    // 计算总内容高度 → 推算弹窗高度
    const gridH = rows * (cellH + cellGap) + bigCardH + cellGap + 52; // 52 for button
    const panelH = gridH + 70; // 70 for title + content top padding

    super({ title: '每日签到', id: 'checkin', width: panelW, height: panelH, screenWidth: 390, screenHeight: 844 });

    // 前 6 天 (3 列)
    for (let i = 0; i < normalDays; i++) {
      const cell = new DayCell(`day-${i}`, i, props.rewards[i], i === props.currentDay, i < props.currentDay);
      cell.width = cellW;
      cell.height = cellH;
      cell.x = gridPad + (i % cols) * (cellW + cellGap);
      cell.y = Math.floor(i / cols) * (cellH + cellGap);
      this.content.addChild(cell);
    }

    // 第 7 天独占一行
    const lastY = rows * (cellH + cellGap);
    const lastCell = new DayCell(`day-${normalDays}`, normalDays, props.rewards[normalDays], normalDays === props.currentDay, normalDays < props.currentDay);
    lastCell.width = contentW;
    lastCell.height = bigCardH;
    lastCell.x = gridPad;
    lastCell.y = lastY;
    this.content.addChild(lastCell);

    // Claim button
    const claimBtn = new Button({
      id: 'claim-btn',
      text: props.claimed ? '已签到' : '签到领取',
      variant: props.claimed ? 'outline' : 'primary',
      disabled: props.claimed,
      width: 180, height: 42,
    });
    claimBtn.x = (contentW - 180) / 2 + gridPad;
    claimBtn.y = lastY + bigCardH + cellGap;
    claimBtn.$on('tap', () => {
      this.$emit('claim', props.currentDay, props.rewards[props.currentDay]);
    });
    this.content.addChild(claimBtn);

    this.open();
  }
}
