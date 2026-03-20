/**
 * Component Gallery — 全组件展示 + 交互试用
 *
 * Tab: Base UI | Business UI
 * 支持触摸/鼠标滚动
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

export class GalleryScene extends SceneNode {
  private galleryTab: GalleryTab = 'base';
  private topTabBar!: TabBar;
  private baseScroll!: ScrollView;
  private bizScroll!: ScrollView;

  // demo states
  private demoProgress = 0;

  onEnter() {
    // Top tab bar
    this.topTabBar = new TabBar({
      id: 'gallery-tabs',
      tabs: [{ key: 'base', label: 'Base UI' }, { key: 'business', label: 'Business UI' }],
      activeKey: 'base',
      width: W,
      height: 36,
    });
    this.topTabBar.y = 8;
    this.topTabBar.$on('change', (key: string) => {
      this.galleryTab = key as GalleryTab;
      this.baseScroll.visible = key === 'base';
      this.bizScroll.visible = key === 'business';
    });
    this.addChild(this.topTabBar);

    // Base UI scroll container
    this.baseScroll = new ScrollView({ id: 'base-scroll', width: W, height: H - 50 });
    this.baseScroll.y = 50;
    this.addChild(this.baseScroll);
    const baseH = this.buildBaseUI(this.baseScroll.content);
    this.baseScroll.contentHeight = baseH;

    // Business UI scroll container
    this.bizScroll = new ScrollView({ id: 'biz-scroll', width: W, height: H - 50 });
    this.bizScroll.y = 50;
    this.bizScroll.visible = false;
    this.addChild(this.bizScroll);
    const bizH = this.buildBusinessUI(this.bizScroll.content);
    this.bizScroll.contentHeight = bizH;
  }

  private buildBaseUI(c: UINode): number {
    let y = 0;

    // ── Section: Buttons ──
    y = this.addSection(c, 'Button — 6 variants', y);
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
      btn.x = (W - 220) / 2;
      btn.y = y;
      btn.$on('tap', () => console.log(`[tap] ${item.v}: ${item.label}`));
      c.addChild(btn);

      const tag = new Label({ text: item.v, fontSize: 10, color: UIColors.textHint, align: 'left', width: 60, height: 20 });
      tag.x = 16;
      tag.y = y + 12;
      c.addChild(tag);
      y += 54;
    }

    // ── Section: Button States ──
    y += 10;
    y = this.addSection(c, 'Button — states', y);
    const stateBtn1 = new Button({ text: '正常', variant: 'primary', width: 160, height: 40 });
    stateBtn1.x = 16; stateBtn1.y = y;
    c.addChild(stateBtn1);

    const stateBtn2 = new Button({ text: '禁用', variant: 'primary', width: 160, height: 40, disabled: true });
    stateBtn2.x = 190; stateBtn2.y = y;
    c.addChild(stateBtn2);
    y += 54;

    // ── Section: Toggle ──
    y = this.addSection(c, 'Toggle — 点击切换（有动画）', y);
    const toggleLabels = [
      { label: '音效', value: true },
      { label: '音乐', value: false },
      { label: '振动', value: false },
    ];
    for (const t of toggleLabels) {
      const toggle = new Toggle({ label: t.label, value: t.value, width: W - 48, height: 32 });
      toggle.x = 24;
      toggle.y = y;
      toggle.$on('change', (v: boolean) => console.log(`[toggle] ${t.label}: ${v}`));
      c.addChild(toggle);
      y += 42;
    }

    // ── Section: TabBar ──
    y += 10;
    y = this.addSection(c, 'TabBar — 点击切换（下划线动画）', y);
    const tabBar1 = new TabBar({
      tabs: [{ key: 'friends', label: '好友' }, { key: 'global', label: '全球' }, { key: 'daily', label: '每日' }],
      activeKey: 'friends', width: W - 32, height: 36,
    });
    tabBar1.x = 16; tabBar1.y = y;
    c.addChild(tabBar1);
    y += 44;

    const tabBar2 = new TabBar({
      tabs: [{ key: 'skin', label: '弹球' }, { key: 'effect', label: '特效' }, { key: 'frame', label: '头像框' }, { key: 'bundle', label: '礼包' }],
      activeKey: 'skin', width: W - 32, height: 36,
    });
    tabBar2.x = 16; tabBar2.y = y;
    c.addChild(tabBar2);
    y += 50;

    // ── Section: ProgressBar ──
    y = this.addSection(c, 'ProgressBar', y);
    const bar1 = new ProgressBar({ id: 'bar-anim', width: W - 48, height: 12 });
    bar1.x = 24; bar1.y = y;
    c.addChild(bar1);
    y += 22;

    const bar2 = new ProgressBar({ width: W - 48, height: 8 });
    bar2.x = 24; bar2.y = y; bar2.value = 0.65; bar2.color = UIColors.success;
    c.addChild(bar2);
    y += 18;

    const bar3 = new ProgressBar({ width: W - 48, height: 8 });
    bar3.x = 24; bar3.y = y; bar3.value = 0.3; bar3.color = UIColors.error;
    c.addChild(bar3);
    y += 24;

    // ── Section: IconButton ──
    y += 10;
    y = this.addSection(c, 'IconButton + Badge + Tag', y);
    const ibIcons = ['pause', 'settings', 'share', 'gift', 'mission', 'star'] as const;
    ibIcons.forEach((name, i) => {
      const ib = new IconButton({ icon: name as any, size: 40, bgColor: UIColors.trackBg, badge: i >= 4 ? i : undefined });
      ib.x = 16 + i * 56;
      ib.y = y;
      ib.$on('tap', () => {
        Toast.show('success', `点击了 ${name}`);
        console.log(`[icon] ${name}`);
      });
      c.addChild(ib);
    });
    y += 50;

    // Tags
    const tags = [
      { text: '限时', bg: UIColors.primary },
      { text: '新品', bg: UIColors.success },
      { text: 'HOT', bg: UIColors.warning },
    ];
    tags.forEach((t, i) => {
      const tag = new Tag({ text: t.text, bgColor: t.bg });
      tag.x = 16 + i * 64;
      tag.y = y;
      c.addChild(tag);
    });
    y += 36;

    // ── Section: Icon Gallery ──
    y += 10;
    y = this.addSection(c, `Icon — ${ALL_ICON_NAMES.length} 图标`, y);
    const iconCols = 7;
    const iconSize = 24;
    const iconGap = (W - 32 - iconCols * iconSize) / (iconCols - 1);
    ALL_ICON_NAMES.forEach((name: IconName, i: number) => {
      const icon = new Icon({ name, size: iconSize, color: UIColors.textLight });
      icon.x = 16 + (i % iconCols) * (iconSize + iconGap);
      icon.y = y + Math.floor(i / iconCols) * (iconSize + 20);
      c.addChild(icon);

      // Label under icon
      const lbl = new Label({ text: name, fontSize: 8, color: UIColors.textHint, align: 'center', width: iconSize + 8, height: 12 });
      lbl.x = icon.x - 4;
      lbl.y = icon.y + iconSize + 2;
      c.addChild(lbl);
    });
    const iconRows = Math.ceil(ALL_ICON_NAMES.length / iconCols);
    y += iconRows * (iconSize + 20) + 10;

    // ── Section: Toast ──
    y = this.addSection(c, 'Toast — 点击触发', y);
    const toastTypes = [
      { type: 'success' as const, text: '操作成功', label: 'Success' },
      { type: 'error' as const, text: '操作失败', label: 'Error' },
      { type: 'reward' as const, text: '+100 金币', label: 'Reward' },
    ];
    toastTypes.forEach((t, i) => {
      const btn = new Button({ text: t.label, variant: i === 2 ? 'gold' : i === 1 ? 'danger' : 'primary', width: 100, height: 36 });
      btn.x = 16 + i * 120;
      btn.y = y;
      btn.$on('tap', () => Toast.show(t.type, t.text));
      c.addChild(btn);
    });
    y += 50;

    // ── Section: Modal ──
    y = this.addSection(c, 'Modal — 点击打开', y);
    const modalBtn = new Button({ text: '打开弹窗', variant: 'secondary', width: 180, height: 40 });
    modalBtn.x = (W - 180) / 2; modalBtn.y = y;
    modalBtn.$on('tap', () => this.showDemoModal());
    c.addChild(modalBtn);
    y += 70;

    // Bottom padding
    y += 40;
    return y;
  }

  private buildBusinessUI(c: UINode): number {
    let y = 0;

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
      y = this.addSection(c, item.label, y);
      const btn = new Button({ text: item.btnText, variant: item.variant, width: 200, height: 44 });
      btn.x = (W - 200) / 2; btn.y = y;
      btn.$on('tap', item.handler);
      c.addChild(btn);
      y += 60;
    }

    // Bottom padding
    y += 60;
    return y;
  }

  private addSection(container: UINode, title: string, y: number): number {
    const label = new Label({ text: title, fontSize: 12, fontWeight: 'bold', color: UIColors.accent, align: 'left', width: W, height: 20 });
    label.x = 16; label.y = y;
    container.addChild(label);
    return y + 26;
  }

  // ── Overlay helpers ──

  private removeOverlay() {
    const old = this.findById('overlay');
    if (old) old.removeFromParent();
  }

  private showDemoModal() {
    this.removeOverlay();
    const pw = 280;
    const modal = new Modal({ id: 'overlay', title: '示例弹窗', screenWidth: W, screenHeight: H, width: pw, height: 220 });
    const descW = 240;
    const desc = new Label({ text: '这是一个 Modal 组件\n支持 open/close 动画', fontSize: 14, color: UIColors.textMuted, align: 'center', width: descW, height: 60 });
    desc.x = (pw - descW) / 2; desc.y = 20;
    modal.content.addChild(desc);

    const btnW = 180;
    const confirmBtn = new Button({ text: '知道了', variant: 'primary', width: btnW, height: 40 });
    confirmBtn.x = (pw - btnW) / 2; confirmBtn.y = 90;
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
      title: '游戏结束',
      score: 12800,
      isNewBest: true,
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
      currentLevel: 5, currentXP: 120, xpToNext: 200, isPremium: false,
      seasonName: '春季赛季',
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

  /** 重写 $render 以在最顶层绘制 Toast */
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
