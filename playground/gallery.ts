/**
 * Component Gallery — 全组件展示 + 交互试用
 *
 * 使用 Layout 系统自动布局，无手动 x/y 计算
 */

import { SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import {
  Button, Label, Modal, ProgressBar, Toggle, TabBar, ScrollView,
  Icon, IconButton, RedDot, Badge, Tag, Toast,
  UIColors, ALL_ICON_NAMES, type IconName,
} from '../packages/ui/src/index';
import {
  CheckinDialog, SettingsPanel, ResultPanel, ShopPanel, LeaderboardPanel,
  BattlePassPanel, LuckyBoxDialog, CoinShopPanel, PrivacyDialog,
  type ShopItem,
} from '../packages/game-ui/src/index';

const W = 390, H = 844;

type GalleryTab = 'base' | 'business';

/** Section header + content wrapper with column layout */
function section(title: string): UINode {
  const s = new UINode({ width: W, layout: 'column', gap: 10, padding: [0, 16, 16, 16] });
  s.addChild(new Label({ text: title, fontSize: 12, fontWeight: 'bold', color: UIColors.accent, align: 'left', width: W - 32, height: 20 }));
  return s;
}

/** Horizontal row with gap */
function row(gap = 10): UINode {
  return new UINode({ width: W - 32, layout: 'row', gap, alignItems: 'center' });
}

export class GalleryScene extends SceneNode {
  private galleryTab: GalleryTab = 'base';
  private topTabBar!: TabBar;
  private baseScroll!: ScrollView;
  private bizScroll!: ScrollView;
  private demoProgress = 0;

  onEnter() {
    // Top tab bar
    this.topTabBar = new TabBar({
      id: 'gallery-tabs',
      tabs: [{ key: 'base', label: 'Base UI' }, { key: 'business', label: 'Business UI' }],
      activeKey: 'base', width: W, height: 36,
    });
    this.topTabBar.y = 8;
    this.topTabBar.$on('change', (key: string) => {
      this.galleryTab = key as GalleryTab;
      this.baseScroll.visible = key === 'base';
      this.bizScroll.visible = key === 'business';
    });
    this.addChild(this.topTabBar);

    // Base UI scroll
    this.baseScroll = new ScrollView({ id: 'base-scroll', width: W, height: H - 50 });
    this.baseScroll.y = 50;
    this.addChild(this.baseScroll);
    this.baseScroll.contentHeight = this.buildBaseUI(this.baseScroll.content);

    // Business UI scroll
    this.bizScroll = new ScrollView({ id: 'biz-scroll', width: W, height: H - 50 });
    this.bizScroll.y = 50;
    this.bizScroll.visible = false;
    this.addChild(this.bizScroll);
    this.bizScroll.contentHeight = this.buildBusinessUI(this.bizScroll.content);
  }

  private buildBaseUI(c: UINode): number {
    // Master column layout for all sections
    const col = new UINode({ id: 'base-col', width: W, layout: 'column', gap: 10 });

    // ── Buttons ──
    const btnSec = section('Button — 6 variants');
    const btnCol = new UINode({ width: W - 32, layout: 'column', gap: 10, alignItems: 'center' });
    const variants: Array<{ v: any; label: string }> = [
      { v: 'primary', label: '开始游戏' },
      { v: 'secondary', label: '每日挑战' },
      { v: 'outline', label: '返回菜单' },
      { v: 'gold', label: '看广告继续' },
      { v: 'danger', label: '退出游戏' },
      { v: 'ghost', label: '跳过 →' },
    ];
    for (const item of variants) {
      const btn = new Button({ text: item.label, variant: item.v, width: 220, height: 44 });
      btn.$on('tap', () => console.log(`[tap] ${item.v}: ${item.label}`));
      btnCol.addChild(btn);
    }
    btnSec.addChild(btnCol);
    col.addChild(btnSec);

    // ── Button States ──
    const stateSec = section('Button — states');
    const stateRow = row(14);
    stateRow.addChild(new Button({ text: '正常', variant: 'primary', width: 160, height: 40 }));
    stateRow.addChild(new Button({ text: '禁用', variant: 'primary', width: 160, height: 40, disabled: true }));
    stateSec.addChild(stateRow);
    col.addChild(stateSec);

    // ── Toggle ──
    const toggleSec = section('Toggle — 点击切换（有动画）');
    const toggleCol = new UINode({ width: W - 32, layout: 'column', gap: 10 });
    for (const t of [{ label: '音效', value: true }, { label: '音乐', value: false }, { label: '振动', value: false }]) {
      const toggle = new Toggle({ label: t.label, value: t.value, width: W - 64, height: 32 });
      toggle.$on('change', (v: boolean) => console.log(`[toggle] ${t.label}: ${v}`));
      toggleCol.addChild(toggle);
    }
    toggleSec.addChild(toggleCol);
    col.addChild(toggleSec);

    // ── TabBar ──
    const tabSec = section('TabBar — 点击切换（下划线动画）');
    const tabCol = new UINode({ width: W - 32, layout: 'column', gap: 8 });
    tabCol.addChild(new TabBar({
      tabs: [{ key: 'friends', label: '好友' }, { key: 'global', label: '全球' }, { key: 'daily', label: '每日' }],
      activeKey: 'friends', width: W - 32, height: 36,
    }));
    tabCol.addChild(new TabBar({
      tabs: [{ key: 'skin', label: '弹球' }, { key: 'effect', label: '特效' }, { key: 'frame', label: '头像框' }, { key: 'bundle', label: '礼包' }],
      activeKey: 'skin', width: W - 32, height: 36,
    }));
    tabSec.addChild(tabCol);
    col.addChild(tabSec);

    // ── ProgressBar ──
    const barSec = section('ProgressBar');
    const barCol = new UINode({ width: W - 32, layout: 'column', gap: 6 });
    const bar1 = new ProgressBar({ id: 'bar-anim', width: W - 64, height: 12 });
    barCol.addChild(bar1);
    const bar2 = new ProgressBar({ width: W - 64, height: 8 });
    bar2.value = 0.65; bar2.color = UIColors.success;
    barCol.addChild(bar2);
    const bar3 = new ProgressBar({ width: W - 64, height: 8 });
    bar3.value = 0.3; bar3.color = UIColors.error;
    barCol.addChild(bar3);
    barSec.addChild(barCol);
    col.addChild(barSec);

    // ── IconButton + Badge + Tag ──
    const iconBtnSec = section('IconButton + Badge + Tag');
    const ibRow = row(12);
    const ibIcons = ['pause', 'settings', 'share', 'gift', 'mission', 'star'] as const;
    for (let i = 0; i < ibIcons.length; i++) {
      const name = ibIcons[i];
      const ib = new IconButton({ icon: name as any, size: 40, bgColor: UIColors.trackBg, badge: i >= 4 ? i : undefined });
      ib.$on('tap', () => { Toast.show('success', `点击了 ${name}`); });
      ibRow.addChild(ib);
    }
    iconBtnSec.addChild(ibRow);

    const tagRow = row(12);
    tagRow.addChild(new Tag({ text: '限时', bgColor: UIColors.primary }));
    tagRow.addChild(new Tag({ text: '新品', bgColor: UIColors.success }));
    tagRow.addChild(new Tag({ text: 'HOT', bgColor: UIColors.warning }));
    iconBtnSec.addChild(tagRow);
    col.addChild(iconBtnSec);

    // ── Icon Gallery (grid) ──
    const iconSec = section(`Icon — ${ALL_ICON_NAMES.length} icons`);
    const iconGrid = new UINode({ width: W - 32, layout: 'row', wrap: true, columns: 7, gap: 8 });
    for (const name of ALL_ICON_NAMES) {
      // Each cell: icon + label stacked
      const cell = new UINode({ width: 40, height: 44, layout: 'column', alignItems: 'center', gap: 2 });
      cell.addChild(new Icon({ name, size: 24, color: UIColors.textLight }));
      cell.addChild(new Label({ text: name, fontSize: 7, color: UIColors.textHint, align: 'center', width: 40, height: 10 }));
      iconGrid.addChild(cell);
    }
    iconSec.addChild(iconGrid);
    col.addChild(iconSec);

    // ── Toast ──
    const toastSec = section('Toast — 点击触发');
    const toastRow = row(10);
    const toastTypes = [
      { type: 'success' as const, text: '操作成功', label: 'Success', v: 'primary' },
      { type: 'error' as const, text: '操作失败', label: 'Error', v: 'danger' },
      { type: 'reward' as const, text: '+100 金币', label: 'Reward', v: 'gold' },
    ];
    for (const t of toastTypes) {
      const btn = new Button({ text: t.label, variant: t.v as any, width: 100, height: 36 });
      btn.$on('tap', () => Toast.show(t.type, t.text));
      toastRow.addChild(btn);
    }
    toastSec.addChild(toastRow);
    col.addChild(toastSec);

    // ── Modal ──
    const modalSec = section('Modal — 点击打开');
    const modalRow = new UINode({ width: W - 32, layout: 'row', justifyContent: 'center' });
    const modalBtn = new Button({ text: '打开弹窗', variant: 'secondary', width: 180, height: 40 });
    modalBtn.$on('tap', () => this.showDemoModal());
    modalRow.addChild(modalBtn);
    modalSec.addChild(modalRow);
    col.addChild(modalSec);

    // Measure total height
    c.addChild(col);
    // Estimate: count sections and their content
    return this.measureColumnHeight(col) + 60;
  }

  private buildBusinessUI(c: UINode): number {
    const col = new UINode({ id: 'biz-col', width: W, layout: 'column', gap: 6 });

    const items: Array<{ label: string; btnText: string; variant: any; handler: () => void }> = [
      { label: 'CheckinDialog — 签到弹窗', btnText: '打开签到', variant: 'primary', handler: () => this.showCheckin() },
      { label: 'SettingsPanel — 设置面板', btnText: '打开设置', variant: 'secondary', handler: () => this.showSettings() },
      { label: 'ResultPanel — 结算页', btnText: '打开结算', variant: 'outline', handler: () => this.showResult() },
      { label: 'ShopPanel — 商店', btnText: '打开商店', variant: 'gold', handler: () => this.showShop() },
      { label: 'LeaderboardPanel — 排行榜', btnText: '打开排行榜', variant: 'secondary', handler: () => this.showLeaderboard() },
      { label: 'BattlePassPanel — 战令', btnText: '打开战令', variant: 'gold', handler: () => this.showBattlePass() },
      { label: 'LuckyBoxDialog — 抽奖', btnText: '打开抽奖', variant: 'danger', handler: () => this.showLuckyBox() },
      { label: 'CoinShopPanel — 金币商店', btnText: '打开金币商店', variant: 'secondary', handler: () => this.showCoinShop() },
      { label: 'PrivacyDialog — 隐私合规', btnText: '打开隐私弹窗', variant: 'outline', handler: () => this.showPrivacy() },
    ];

    for (const item of items) {
      const sec = section(item.label);
      const btnRow = new UINode({ width: W - 32, layout: 'row', justifyContent: 'center' });
      const btn = new Button({ text: item.btnText, variant: item.variant, width: 200, height: 44 });
      btn.$on('tap', item.handler);
      btnRow.addChild(btn);
      sec.addChild(btnRow);
      col.addChild(sec);
    }

    c.addChild(col);
    return items.length * 90 + 80;
  }

  /** Rough height estimation for scroll content */
  private measureColumnHeight(col: UINode): number {
    let h = 0;
    const gap = col.gap ?? 0;
    for (let i = 0; i < col.$children.length; i++) {
      const child = col.$children[i];
      // Recursively estimate section height
      h += this.estimateHeight(child);
      if (i < col.$children.length - 1) h += gap;
    }
    return h;
  }

  private estimateHeight(node: UINode): number {
    if (!node.visible) return 0;
    if (node.layout === 'column') {
      let h = 0;
      const gap = node.gap ?? 0;
      const pad = this.parsePad(node.padding);
      for (let i = 0; i < node.$children.length; i++) {
        h += this.estimateHeight(node.$children[i]);
        if (i < node.$children.length - 1) h += gap;
      }
      return h + pad[0] + pad[2];
    }
    if (node.layout === 'row' && node.wrap) {
      const pad = this.parsePad(node.padding);
      const availW = node.width - pad[1] - pad[3];
      const gap = node.gap ?? 0;
      const cols = node.columns ?? Math.floor((availW + gap) / ((node.$children[0]?.width || 40) + gap));
      const rows = Math.ceil(node.$children.length / Math.max(1, cols));
      const rowH = node.$children[0]?.height ?? 40;
      return rows * rowH + Math.max(0, rows - 1) * gap + pad[0] + pad[2];
    }
    if (node.layout === 'row') {
      const pad = this.parsePad(node.padding);
      let maxH = 0;
      for (const child of node.$children) {
        maxH = Math.max(maxH, child.height);
      }
      return maxH + pad[0] + pad[2];
    }
    return node.height || 0;
  }

  private parsePad(p: any): [number, number, number, number] {
    if (!p) return [0, 0, 0, 0];
    if (typeof p === 'number') return [p, p, p, p];
    return p;
  }

  // ── Overlay helpers (unchanged) ──

  private removeOverlay() {
    const old = this.findById('overlay');
    if (old) old.removeFromParent();
  }

  private showDemoModal() {
    this.removeOverlay();
    const pw = 280;
    const modal = new Modal({ id: 'overlay', title: '示例弹窗', screenWidth: W, screenHeight: H, width: pw, height: 220 });

    // Modal content using column layout
    modal.content.layout = 'column';
    modal.content.alignItems = 'center';
    modal.content.gap = 16;

    modal.content.addChild(new Label({ text: '这是一个 Modal 组件\n支持 open/close 动画', fontSize: 14, color: UIColors.textMuted, align: 'center', width: 240, height: 60 }));
    const confirmBtn = new Button({ text: '知道了', variant: 'primary', width: 180, height: 40 });
    confirmBtn.$on('tap', () => { modal.close(); setTimeout(() => modal.removeFromParent(), 200); });
    modal.content.addChild(confirmBtn);

    modal.open();
    this.addChild(modal);
  }

  private showCheckin() {
    this.removeOverlay();
    const checkin = new CheckinDialog({ rewards: [10, 10, 15, 20, 20, 25, 50], currentDay: 3, claimed: false });
    checkin.id = 'overlay';
    checkin.$on('claim', (day: number, reward: number) => {
      console.log(`[签到] Day${day + 1} +${reward}`);
      checkin.close();
      setTimeout(() => checkin.removeFromParent(), 200);
    });
    checkin.$on('close', () => setTimeout(() => checkin.removeFromParent(), 200));
    this.addChild(checkin);
  }

  private showSettings() {
    this.removeOverlay();
    const settings = new SettingsPanel({
      toggles: [
        { id: 'sound', label: '音效', value: true },
        { id: 'music', label: '音乐', value: true },
        { id: 'vibration', label: '振动', value: false },
      ],
      links: [{ id: 'privacy', label: '隐私协议' }],
      version: 'v0.1.0',
    });
    settings.id = 'overlay';
    settings.$on('toggle', (id: string, val: boolean) => console.log(`[设置] ${id}: ${val}`));
    settings.$on('close', () => setTimeout(() => settings.removeFromParent(), 200));
    this.addChild(settings);
  }

  private showResult() {
    this.removeOverlay();
    const result = new ResultPanel({
      title: '游戏结束', score: 12800, isNewBest: true,
      stats: [
        { icon: 'shield', label: '关卡', value: '12' },
        { icon: 'block', label: '方块', value: '3,456' },
        { icon: 'lightning', label: '连击', value: '8x' },
        { icon: 'clock', label: '用时', value: '2:34' },
      ],
      buttons: [
        { id: 'retry', label: '再来一次', variant: 'primary' },
        { id: 'menu', label: '返回菜单', variant: 'outline' },
      ],
    });
    result.addButton({ id: 'share', label: '分享挑战', variant: 'secondary' });
    result.id = 'overlay';
    result.$on('action', (id: string) => {
      console.log(`[结算] action: ${id}`);
      if (id === 'close' || id === 'retry' || id === 'menu') result.removeFromParent();
    });
    this.addChild(result);
  }

  private showShop() {
    this.removeOverlay();
    const items: ShopItem[] = [
      { id: 'default', name: '默认球', desc: '经典白色', icon: '⚪', category: 'skin', owned: true, equipped: true },
      { id: 'rainbow', name: '彩虹球', desc: '色相旋转', icon: '🌈', category: 'skin', owned: true, equipped: false },
      { id: 'flame', name: '火焰球', desc: '橙红光晕', icon: '🔥', category: 'skin', owned: false, equipped: false, price: '500' },
      { id: 'frost', name: '冰霜球', desc: '冰蓝光晕', icon: '❄️', category: 'skin', owned: false, equipped: false, price: '500' },
      { id: 'sakura', name: '樱花', desc: '粉色飘落', icon: '🌸', category: 'effect', owned: true, equipped: false },
      { id: 'lightning', name: '雷电', desc: '金色电弧', icon: '⚡', category: 'effect', owned: true, equipped: true },
    ];
    const shop = new ShopPanel({
      id: 'overlay',
      tabs: [{ key: 'skin', label: '弹球皮肤' }, { key: 'effect', label: '消除特效' }],
      items,
    });
    shop.$on('close', () => shop.removeFromParent());
    shop.$on('equip', (item: ShopItem) => console.log('[装备]', item.id));
    shop.$on('purchase', (item: ShopItem) => console.log('[购买]', item.id));
    this.addChild(shop);
  }

  private showLeaderboard() {
    this.removeOverlay();
    const panel = new LeaderboardPanel({
      entries: [
        { rank: 1, name: '玩家A', score: 15200 },
        { rank: 2, name: '玩家B', score: 12800 },
        { rank: 3, name: '玩家C', score: 9600 },
        { rank: 4, name: '我', score: 8400, isMe: true },
        { rank: 5, name: '玩家D', score: 6200 },
      ],
      tabs: [{ key: 'friends', label: '好友' }, { key: 'global', label: '全球' }],
    });
    panel.id = 'overlay';
    panel.$on('close', () => panel.removeFromParent());
    this.addChild(panel);
  }

  private showBattlePass() {
    this.removeOverlay();
    const panel = new BattlePassPanel({
      currentLevel: 5, currentXP: 120, xpToNext: 200, isPremium: false, seasonName: '春季赛季',
      rewards: [
        { level: 1, freeReward: { icon: '🪙', label: '+50 金币' }, paidReward: { icon: '🌈', label: '彩虹球' }, freeClaimed: true },
        { level: 2, freeReward: { icon: '🪙', label: '+100 金币' }, freeClaimed: true },
        { level: 3, freeReward: { icon: '💎', label: '+5 钻石' }, paidReward: { icon: '🔥', label: '火焰球' }, freeClaimed: true },
        { level: 4, freeReward: { icon: '🪙', label: '+150 金币' }, paidReward: { icon: '🖼', label: '春日头像框' }, freeClaimed: true },
        { level: 5, freeReward: { icon: '🎫', label: '复活币×2' }, paidReward: { icon: '❄️', label: '冰霜球' } },
        { level: 6, freeReward: { icon: '🪙', label: '+200 金币' } },
        { level: 7, freeReward: { icon: '🏆', label: '春季终极框' }, paidReward: { icon: '🌸', label: '樱花特效' } },
      ],
    });
    panel.id = 'overlay';
    panel.$on('close', () => panel.removeFromParent());
    panel.$on('claimReward', (lv: number, track: string) => console.log(`[战令] claim Lv.${lv} ${track}`));
    panel.$on('buyPremium', () => console.log('[战令] buyPremium'));
    this.addChild(panel);
  }

  private showLuckyBox() {
    this.removeOverlay();
    const dialog = new LuckyBoxDialog({ fragments: 7, redeemCost: 10, freeOpens: 1, adOpens: 2 });
    dialog.id = 'overlay';
    dialog.$on('open', () => console.log('[抽奖] open'));
    dialog.$on('openByAd', () => console.log('[抽奖] openByAd'));
    dialog.$on('redeem', () => console.log('[抽奖] redeem'));
    dialog.$on('close', () => setTimeout(() => dialog.removeFromParent(), 200));
    this.addChild(dialog);
  }

  private showCoinShop() {
    this.removeOverlay();
    const panel = new CoinShopPanel({
      coins: 2580,
      items: [
        { id: 'revive', name: '复活币', desc: '游戏结束时复活', icon: '💫', cost: 500 },
        { id: 'multi', name: '多球×3', desc: '下局+3球', icon: '🏀', cost: 300, owned: 1 },
        { id: 'freeze', name: '冰冻球×3', desc: '下局+3冰冻', icon: '❄️', cost: 400 },
        { id: 'bomb', name: '炸弹×1', desc: '清除一行', icon: '💣', cost: 800 },
      ],
    });
    panel.id = 'overlay';
    panel.$on('close', () => panel.removeFromParent());
    panel.$on('purchase', (item: any) => console.log('[金币商店] purchase', item.id));
    this.addChild(panel);
  }

  private showPrivacy() {
    this.removeOverlay();
    const dialog = new PrivacyDialog();
    dialog.id = 'overlay';
    dialog.$on('agree', () => {
      console.log('[隐私] agreed');
      setTimeout(() => dialog.removeFromParent(), 200);
    });
    dialog.$on('viewPolicy', () => console.log('[隐私] viewPolicy'));
    dialog.$on('close', () => setTimeout(() => dialog.removeFromParent(), 200));
    this.addChild(dialog);
  }

  onBeforeUpdate() {
    this.demoProgress += 0.004;
    if (this.demoProgress > 1.2) this.demoProgress = 0;
    const bar = this.findById('bar-anim') as ProgressBar | null;
    if (bar) bar.value = Math.min(this.demoProgress, 1);
    Toast.update(0.016);
  }

  $render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    this.draw(ctx);
    for (const child of this.$children) {
      child.$render(ctx);
    }
    Toast.draw(ctx, W, H);
    ctx.restore();
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, UIColors.bgTop);
    grad.addColorStop(1, UIColors.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}
