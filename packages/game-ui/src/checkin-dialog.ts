import { UINode } from '@lucid/core';
import { Modal, Button, Label } from '@lucid/ui';

class DayCell extends UINode {
  private _isToday: boolean;
  private _completed: boolean;

  constructor(id: string, public day: number, public reward: number, isToday: boolean, completed: boolean) {
    super({ id, width: 40, height: 50 });
    this._isToday = isToday;
    this._completed = completed;
  }

  get $text() { return `${this.reward}`; }
  get $highlighted() { return this._isToday; }
}

export interface CheckinDialogProps {
  rewards: number[];
  currentDay: number;
  claimed: boolean;
}

export class CheckinDialog extends Modal {
  constructor(props: CheckinDialogProps) {
    super({ title: '每日签到', id: 'checkin', width: 320, height: 400 });

    // Day cells
    for (let i = 0; i < props.rewards.length; i++) {
      const isToday = i === props.currentDay;
      const completed = i < props.currentDay;
      const cell = new DayCell(`day-${i}`, i, props.rewards[i], isToday, completed);
      this.content.addChild(cell);
    }

    // Claim button
    const claimBtn = new Button({
      id: 'claim-btn',
      text: props.claimed ? '已签到' : '签到领取',
      variant: props.claimed ? 'outline' : 'primary',
      disabled: props.claimed,
    });
    claimBtn.$on('tap', () => {
      this.$emit('claim', props.currentDay, props.rewards[props.currentDay]);
    });
    this.content.addChild(claimBtn);

    this.open();
  }
}
