/**
 * CoinShopPanel — 金币商店（参照 template coin-shop.ts）
 */

import { UINode } from '@lucid/core';
import { Button, Label, UIColors, drawIcon } from '@lucid/ui';

export interface CoinShopItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  owned?: number;
}

class CoinShopCard extends UINode {
  constructor(public item: CoinShopItem) {
    super({ id: `coin-item-${item.id}`, width: 170, height: 100 });
    this.interactive = true;
    this.$on('touchend', () => this.$emit('tap'));
  }

  get $text() { return this.item.name; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fillStyle = UIColors.cardBg;
    ctx.fill();

    // Item icon (user content emoji from props)
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.item.icon, w / 2, 24);

    ctx.fillStyle = UIColors.text;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(this.item.name, w / 2, 52);

    ctx.fillStyle = UIColors.textMuted;
    ctx.font = '10px sans-serif';
    ctx.fillText(this.item.desc, w / 2, 68);

    // Price with coin icon
    drawIcon(ctx, 'coin', w / 2 - 18, 88, 12, UIColors.accent);
    ctx.fillStyle = UIColors.accent;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.item.cost}`, w / 2 + 4, 88);

    if (this.item.owned !== undefined && this.item.owned > 0) {
      ctx.fillStyle = 'rgba(76,175,80,0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`×${this.item.owned}`, w - 8, 14);
    }
  }
}

export interface CoinShopPanelProps {
  coins: number;
  items: CoinShopItem[];
}

export class CoinShopPanel extends UINode {
  private _coins: number;
  private _items: CoinShopItem[];

  protected $inspectInfo(): string {
    return `coins=${this._coins} ${this._items.length}items`;
  }

  constructor(props: CoinShopPanelProps) {
    super({ id: 'coin-shop', width: 390, height: 844 });
    this.interactive = true;
    this._coins = props.coins;
    this._items = props.items;

    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 36 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    const title = new Label({ text: '金币商店', fontSize: 18, fontWeight: 'bold', color: UIColors.text, align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    // Coin balance with icon
    const coinLabel = new Label({ id: 'coin-balance', text: `${props.coins}`, fontSize: 14, fontWeight: 'bold', color: UIColors.accent, align: 'right', width: 80, height: 20 });
    coinLabel.x = 290; coinLabel.y = 20;
    this.addChild(coinLabel);

    // Coin icon next to balance
    const coinIcon = new UINode({ id: 'coin-icon', width: 16, height: 16 });
    coinIcon.x = 272; coinIcon.y = 22;
    (coinIcon as any)._drawCoin = true;
    const origDraw = coinIcon['draw'].bind(coinIcon);
    coinIcon['draw'] = (ctx: CanvasRenderingContext2D) => {
      drawIcon(ctx, 'coin', 8, 8, 14, UIColors.accent);
    };
    this.addChild(coinIcon);

    const gap = 10;
    const cardW = 170;
    const startY = 64;
    props.items.forEach((item, i) => {
      const card = new CoinShopCard(item);
      card.x = i % 2 === 0 ? 15 : 15 + cardW + gap;
      card.y = startY + Math.floor(i / 2) * (110);
      card.$on('tap', () => this.$emit('purchase', item));
      this.addChild(card);
    });
  }

  updateCoins(coins: number): void {
    this._coins = coins;
    const label = this.findById('coin-balance') as Label | null;
    if (label) label.text = `${coins}`;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
