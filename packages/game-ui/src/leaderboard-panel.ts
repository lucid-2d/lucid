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
    if (this.entry.isMe) {
      ctx.fillStyle = 'rgba(255,209,102,0.12)';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 6);
      ctx.fill();
    }

    ctx.fillStyle = this.entry.isMe ? '#ffd166' : '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.entry.rank}`, 12, this.height / 2);

    ctx.font = '14px sans-serif';
    ctx.fillText(this.entry.name, 48, this.height / 2);

    ctx.textAlign = 'right';
    ctx.fillText(String(this.entry.score), this.width - 12, this.height / 2);
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

    // Close
    const closeBtn = new Button({ id: 'close-btn', text: '×', variant: 'ghost', width: 40, height: 40 });
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    // Tabs
    if (props.tabs) {
      const tabBar = new TabBar({ id: 'tab-bar', tabs: props.tabs, activeKey: props.tabs[0].key, width: 390, height: 40 });
      tabBar.$on('change', (key: string) => this.$emit('tabChange', key));
      this.addChild(tabBar);
    }

    // Entries
    this._entryContainer = new UINode({ id: 'entries' });
    this.addChild(this._entryContainer);
    this._buildEntries();
  }

  private _buildEntries(): void {
    for (const child of [...this._entryContainer.$children]) {
      this._entryContainer.removeChild(child);
    }
    this._entries.forEach((entry, i) => {
      this._entryContainer.addChild(new EntryRow(`entry-${i}`, entry));
    });
  }

  updateEntries(entries: LeaderboardEntry[]): void {
    this._entries = entries;
    this._buildEntries();
  }
}
