import { UINode } from '@lucid/core';
import { Button, TabBar, Label, type TabItem } from '@lucid/ui';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isMe?: boolean;
}

class EntryRow extends UINode {
  constructor(id: string, public entry: LeaderboardEntry) {
    super({ id, width: 350, height: 48 });
  }

  get $text() { return `#${this.entry.rank} ${this.entry.name} ${this.entry.score}`; }
  get $highlighted() { return this.entry.isMe ?? false; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // Background for "me" row
    if (this.entry.isMe) {
      ctx.fillStyle = 'rgba(255,209,102,0.12)';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 6);
      ctx.fill();
    }

    // Rank medal
    const medals = ['🥇', '🥈', '🥉'];
    const rankStr = this.entry.rank <= 3 ? medals[this.entry.rank - 1] : `${this.entry.rank}`;
    ctx.fillStyle = this.entry.isMe ? '#ffd166' : 'rgba(255,255,255,0.6)';
    ctx.font = this.entry.rank <= 3 ? '18px sans-serif' : 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankStr, 24, this.height / 2);

    // Name
    ctx.fillStyle = this.entry.isMe ? '#ffd166' : '#ffffff';
    ctx.font = `${this.entry.isMe ? 'bold ' : ''}14px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(this.entry.name, 52, this.height / 2);

    // Score
    ctx.textAlign = 'right';
    ctx.fillText(String(this.entry.score), this.width - 12, this.height / 2);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
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
    this._entries = props.entries;

    // Close button
    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 36 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    // Title
    const title = new Label({ text: '排行榜', fontSize: 18, fontWeight: 'bold', color: '#ffffff', align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    // Tabs
    if (props.tabs) {
      const tabBar = new TabBar({ id: 'tab-bar', tabs: props.tabs, activeKey: props.tabs[0].key, width: 390, height: 40 });
      tabBar.y = 56;
      tabBar.$on('change', (key: string) => this.$emit('tabChange', key));
      this.addChild(tabBar);
    }

    // Entries
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
    // Full screen background
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
