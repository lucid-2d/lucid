import { UINode } from '@lucid-2d/core';
import { Button, TabBar, Label, UIColors, drawIcon, type TabItem } from '@lucid-2d/ui';

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
  selected = false;

  constructor(public item: ShopItem) {
    super({ id: `card-${item.id}`, width: 80, height: 90 });
    this.interactive = true;
    this.$on('touchstart', () => {});
    this.$on('touchend', () => this.$emit('tap'));
  }

  get $text() { return this.item.name; }
  get $highlighted() { return this.selected || this.item.equipped; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;
    const isActive = this.selected || this.item.equipped;

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fillStyle = isActive ? 'rgba(233,69,96,0.2)' : UIColors.cardBg;
    ctx.fill();
    if (isActive) {
      ctx.strokeStyle = this.selected ? UIColors.accent : UIColors.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Item icon (user content — emoji from props)
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.item.icon, w / 2, 28);

    ctx.fillStyle = UIColors.text;
    ctx.font = '12px sans-serif';
    ctx.fillText(this.item.name, w / 2, 56);

    if (!this.item.owned && this.item.price) {
      // Price with coin icon
      drawIcon(ctx, 'coin', w / 2 - 18, 76, 12, UIColors.accent);
      ctx.fillStyle = UIColors.accent;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.item.price, w / 2 + 4, 76);
    } else if (this.item.owned) {
      ctx.fillStyle = UIColors.textHint;
      ctx.font = '10px sans-serif';
      ctx.fillText(this.item.equipped ? '使用中' : '已拥有', w / 2, 76);
    }
  }
}

export interface ShopPanelProps extends Record<string, any> {
  id?: string;
  tabs: TabItem[];
  items: ShopItem[];
  renderPreview?: (ctx: CanvasRenderingContext2D, item: ShopItem) => void;
}

/**
 * ShopPanel — 商店面板
 *
 * ## Node IDs (stable, for testing)
 * - `shop` — panel root
 * - `close-btn` — 返回按钮
 * - `tab-bar` — 分类标签栏
 * - `cards` — 卡片容器
 * - `action-btn` — 购买/装备操作按钮
 * - `card-{index}` — 商品卡片（index 为 ShopItem.id）
 *
 * ## Events
 * - `close()` — 关闭按钮
 * - `select(item)` — 选中商品卡片
 * - `purchase(item)` — 购买未拥有的商品
 * - `equip(item)` — 装备已拥有的商品
 * - `tabChange(key)` — 切换分类标签（由内部 TabBar 'change' 触发）
 *
 * ## Testing
 * ```ts
 * tap(app, 'close-btn');     // 触发 close 事件
 * tap(app, 'card-skin1');    // 选中商品 → select 事件
 * tap(app, 'action-btn');    // 购买或装备 → purchase / equip 事件
 * ```
 */
export class ShopPanel extends UINode {
  private _items: ShopItem[];
  private _selectedItem: ShopItem | null = null;
  private _activeTab: string;
  private _tabBar: TabBar;
  private _cardContainer: UINode;
  private _actionBtn: Button;

  constructor(props: ShopPanelProps) {
    super({ id: props.id ?? 'shop', width: 390, height: 844 });
    this.interactive = true;
    this._items = props.items;
    this._activeTab = props.tabs[0]?.key ?? '';

    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 44 });
    closeBtn.x = 4; closeBtn.y = 8;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    const title = new Label({ text: '商店', fontSize: 18, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    this._tabBar = new TabBar({ id: 'tab-bar', tabs: props.tabs, activeKey: this._activeTab, width: 390, height: 40 });
    this._tabBar.y = 56;
    this._tabBar.$on('change', (key: string) => {
      this._activeTab = key;
      this._selectedItem = null;
      this._rebuildCards();
    });
    this.addChild(this._tabBar);

    this._cardContainer = new UINode({ id: 'cards' });
    this._cardContainer.y = 110;
    this.addChild(this._cardContainer);

    this._actionBtn = new Button({ id: 'action-btn', text: '选择物品', variant: 'primary', width: 220, height: 44, disabled: true });
    this._actionBtn.x = 85; this._actionBtn.y = 750;
    this._actionBtn.$on('tap', () => this._handleAction());
    this.addChild(this._actionBtn);

    this._rebuildCards();
  }

  private _rebuildCards(): void {
    for (const child of [...this._cardContainer.$children]) {
      this._cardContainer.removeChild(child);
    }

    const tabItems = this._items.filter(i => i.category === this._activeTab);
    const cols = 4, gap = 10, padX = 15;
    const cardW = (390 - padX * 2 - gap * (cols - 1)) / cols;

    tabItems.forEach((item, i) => {
      const card = new ShopCard(item);
      card.width = cardW;
      card.x = padX + (i % cols) * (cardW + gap);
      card.y = Math.floor(i / cols) * (card.height + gap);
      card.$on('tap', () => {
        for (const c of this._cardContainer.$children) {
          if (c instanceof ShopCard) c.selected = false;
        }
        card.selected = true;
        this._selectedItem = item;
        this.$emit('select', item);
        this._updateActionBtn();
      });
      this._cardContainer.addChild(card);
    });

    if (tabItems.length > 0 && !this._selectedItem) {
      this._selectedItem = tabItems[0];
      this._updateActionBtn();
    }
  }

  private _updateActionBtn(): void {
    if (!this._selectedItem) {
      this._actionBtn.text = '选择物品';
      this._actionBtn.disabled = true;
    } else if (this._selectedItem.equipped) {
      this._actionBtn.text = '已装备';
      this._actionBtn.disabled = true;
    } else if (this._selectedItem.owned) {
      this._actionBtn.text = '装备';
      this._actionBtn.disabled = false;
      this._actionBtn.variant = 'primary';
    } else {
      this._actionBtn.text = this._selectedItem.price ? `购买 ${this._selectedItem.price}` : '获取';
      this._actionBtn.disabled = false;
      this._actionBtn.variant = 'gold';
    }
  }

  private _handleAction(): void {
    if (!this._selectedItem) return;
    if (this._selectedItem.equipped) return;
    if (this._selectedItem.owned) this.$emit('equip', this._selectedItem);
    else this.$emit('purchase', this._selectedItem);
  }

  updateItems(items: ShopItem[]): void {
    this._items = items;
    this._selectedItem = null;
    this._rebuildCards();
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, 844);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 390, 844);
  }
}
