import { UINode } from '@lucid/core';
import { Button, TabBar, type TabItem } from '@lucid/ui';

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: string;
  owned: boolean;
  equipped: boolean;
  price?: string;
}

class ShopCard extends UINode {
  constructor(public item: ShopItem) {
    super({ id: `card-${item.id}`, width: 80, height: 90 });
    this.interactive = true;

    this.$on('touchstart', () => {});
    this.$on('touchend', () => { this.$emit('tap'); });
  }

  get $text() { return this.item.name; }
  get $highlighted() { return this.item.equipped; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.item.equipped ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 8);
    ctx.fill();

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.item.icon, this.width / 2, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(this.item.name, this.width / 2, 55);

    if (!this.item.owned && this.item.price) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px sans-serif';
      ctx.fillText(this.item.price, this.width / 2, 75);
    }
  }
}

export interface ShopPanelProps {
  tabs: TabItem[];
  items: ShopItem[];
  renderPreview?: (ctx: CanvasRenderingContext2D, item: ShopItem) => void;
}

export class ShopPanel extends UINode {
  private _items: ShopItem[];
  private _selectedItem: ShopItem | null = null;
  private _activeTab: string;
  private _tabBar: TabBar;
  private _cardContainer: UINode;
  private _actionBtn: Button;
  private _renderPreview?: (ctx: CanvasRenderingContext2D, item: ShopItem) => void;

  constructor(props: ShopPanelProps) {
    super({ id: 'shop', width: 390, height: 844 });
    this._items = props.items;
    this._activeTab = props.tabs[0]?.key ?? '';
    this._renderPreview = props.renderPreview;

    // Close button
    const closeBtn = new Button({ id: 'close-btn', text: '×', variant: 'ghost', width: 40, height: 40 });
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    // Tab bar
    this._tabBar = new TabBar({ id: 'tab-bar', tabs: props.tabs, activeKey: this._activeTab, width: 390, height: 40 });
    this._tabBar.$on('change', (key: string) => {
      this._activeTab = key;
      this._selectedItem = null;
      this._rebuildCards();
      this.$emit('tabChange', key);
    });
    this.addChild(this._tabBar);

    // Card container
    this._cardContainer = new UINode({ id: 'cards' });
    this.addChild(this._cardContainer);

    // Action button
    this._actionBtn = new Button({ id: 'action-btn', text: '选择', variant: 'primary', width: 200, height: 44 });
    this._actionBtn.$on('tap', () => this._handleAction());
    this.addChild(this._actionBtn);

    this._rebuildCards();
  }

  private _rebuildCards(): void {
    // Remove old cards
    for (const child of [...this._cardContainer.$children]) {
      this._cardContainer.removeChild(child);
    }

    const tabItems = this._items.filter(i => i.category === this._activeTab);
    for (const item of tabItems) {
      const card = new ShopCard(item);
      card.$on('tap', () => {
        this._selectedItem = item;
        this.$emit('select', item);
        this._updateActionBtn();
      });
      this._cardContainer.addChild(card);
    }

    // Auto-select first
    if (tabItems.length > 0 && !this._selectedItem) {
      this._selectedItem = tabItems[0];
      this._updateActionBtn();
    }
  }

  private _updateActionBtn(): void {
    if (!this._selectedItem) {
      this._actionBtn.text = '选择';
      this._actionBtn.disabled = true;
      return;
    }
    if (this._selectedItem.equipped) {
      this._actionBtn.text = '已装备';
      this._actionBtn.disabled = true;
    } else if (this._selectedItem.owned) {
      this._actionBtn.text = '装备';
      this._actionBtn.disabled = false;
    } else {
      this._actionBtn.text = this._selectedItem.price ? `购买 ${this._selectedItem.price}` : '获取';
      this._actionBtn.disabled = false;
    }
  }

  private _handleAction(): void {
    if (!this._selectedItem) return;
    if (this._selectedItem.equipped) return;
    if (this._selectedItem.owned) {
      this.$emit('equip', this._selectedItem);
    } else {
      this.$emit('purchase', this._selectedItem);
    }
  }

  updateItems(items: ShopItem[]): void {
    this._items = items;
    this._selectedItem = null;
    this._rebuildCards();
  }
}
