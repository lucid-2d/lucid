import { UINode } from '@lucid-2d/core';
import { Button, TabBar, Label, UIColors, drawIcon, type TabItem } from '@lucid-2d/ui';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isMe?: boolean;
}

const MEDAL_COLORS = ['#ffd166', '#c0c0c0', '#cd7f32']; // gold, silver, bronze

class EntryRow extends UINode {
  constructor(id: string, public entry: LeaderboardEntry) {
    super({ id, width: 350, height: 48 });
  }

  get $text() { return `#${this.entry.rank} ${this.entry.name} ${this.entry.score}`; }
  get $highlighted() { return this.entry.isMe ?? false; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    if (this.entry.isMe) {
      ctx.fillStyle = 'rgba(255,209,102,0.12)';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 6);
      ctx.fill();
    }

    // Rank — medal icon for top 3, number for others
    if (this.entry.rank <= 3) {
      drawIcon(ctx, 'medal', 24, this.height / 2, 22, MEDAL_COLORS[this.entry.rank - 1]);
    } else {
      ctx.fillStyle = this.entry.isMe ? UIColors.accent : UIColors.textMuted;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.entry.rank}`, 24, this.height / 2);
    }

    // Name
    ctx.fillStyle = this.entry.isMe ? UIColors.accent : UIColors.text;
    ctx.font = `${this.entry.isMe ? 'bold ' : ''}14px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.entry.name, 52, this.height / 2);

    // Score
    ctx.textAlign = 'right';
    ctx.fillText(String(this.entry.score), this.width - 12, this.height / 2);

    // Divider
    ctx.strokeStyle = UIColors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, this.height - 0.5);
    ctx.lineTo(this.width - 12, this.height - 0.5);
    ctx.stroke();
  }
}

export interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  tabs?: TabItem[];
  myEntry?: LeaderboardEntry;
}

export class LeaderboardPanel extends UINode {
  private _entries: LeaderboardEntry[];
  private _entryContainer: UINode;

  constructor(props: LeaderboardPanelProps) {
    super({ id: 'leaderboard', width: 390, height: 844 });
    this.interactive = true;
    this._entries = props.entries;

    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 36 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    const title = new Label({ text: '排行榜', fontSize: 18, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    if (props.tabs) {
      const tabBar = new TabBar({ id: 'tab-bar', tabs: props.tabs, activeKey: props.tabs[0].key, width: 390, height: 40 });
      tabBar.y = 56;
      tabBar.$on('change', (key: string) => this.$emit('tabChange', key));
      this.addChild(tabBar);
    }

    this._entryContainer = new UINode({ id: 'entries' });
    this._entryContainer.y = props.tabs ? 110 : 60;
    this.addChild(this._entryContainer);
    this._buildEntries();
  }

  private _buildEntries(): void {
    for (const child of [...this._entryContainer.$children]) {
      this._entryContainer.removeChild(child);
    }
    this._entries.forEach((entry, i) => {
      const row = new EntryRow(`entry-${i}`, entry);
      row.x = 20;
      row.y = i * 52;
      this._entryContainer.addChild(row);
    });
  }

  updateEntries(entries: LeaderboardEntry[]): void {
    this._entries = entries;
    this._buildEntries();
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
