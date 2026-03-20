/**
 * CoinShopPanel — 金币商店（参照 template coin-shop.ts）
 *
 * 消耗品/增益道具购买，用游戏内金币支付
 */

import { UINode } from '@lucid/core';
import { Button, Label } from '@lucid/ui';

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
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();

    // Icon
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.item.icon, w / 2, 24);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(this.item.name, w / 2, 52);

    // Desc
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.fillText(this.item.desc, w / 2, 68);

    // Price
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`🪙 ${this.item.cost}`, w / 2, 88);

    // Owned count
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

  constructor(props: CoinShopPanelProps) {
    super({ id: 'coin-shop', width: 390, height: 844 });
    this.interactive = true;
    this._coins = props.coins;
    this._items = props.items;

    // Close
    const closeBtn = new Button({ id: 'close-btn', text: '← 返回', variant: 'ghost', width: 80, height: 36 });
    closeBtn.x = 4; closeBtn.y = 12;
    closeBtn.$on('tap', () => this.$emit('close'));
    this.addChild(closeBtn);

    // Title + coins
    const title = new Label({ text: '金币商店', fontSize: 18, fontWeight: 'bold', color: '#ffffff', align: 'center', width: 390, height: 30 });
    title.y = 16;
    this.addChild(title);

    const coinLabel = new Label({ id: 'coin-balance', text: `🪙 ${props.coins}`, fontSize: 14, fontWeight: 'bold', color: '#ffd166', align: 'right', width: 100, height: 20 });
    coinLabel.x = 270; coinLabel.y = 20;
    this.addChild(coinLabel);

    // Item grid (2 columns)
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
    if (label) label.text = `🪙 ${coins}`;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
