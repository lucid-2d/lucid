/**
 * Component Gallery — 全组件展示 + 交互试用
 *
 * Tab: Base UI | Business UI
 * 参照 template ui-gallery.ts 的布局风格
 */

import { SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import { Button, Label, Modal, ProgressBar, Toggle, TabBar, ScrollView, Icon, IconButton, RedDot, Badge, Tag, Toast } from '../packages/ui/src/index';
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
  private baseContainer!: UINode;
  private bizContainer!: UINode;

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
      this.baseContainer.visible = key === 'base';
      this.bizContainer.visible = key === 'business';
    });
    this.addChild(this.topTabBar);

    // Base UI container
    this.baseContainer = new UINode({ id: 'base-ui' });
    this.baseContainer.y = 50;
    this.addChild(this.baseContainer);
    this.buildBaseUI();

    // Business UI container
    this.bizContainer = new UINode({ id: 'biz-ui' });
    this.bizContainer.y = 50;
    this.bizContainer.visible = false;
    this.addChild(this.bizContainer);
    this.buildBusinessUI();
  }

  private buildBaseUI() {
    const c = this.baseContainer;
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

      // variant 标签
      const tag = new Label({ text: item.v, fontSize: 10, color: 'rgba(255,255,255,0.3)', align: 'left', width: 60, height: 20 });
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
    bar2.x = 24; bar2.y = y; bar2.value = 0.65; bar2.color = '#4caf50';
    c.addChild(bar2);
    y += 18;

    const bar3 = new ProgressBar({ width: W - 48, height: 8 });
    bar3.x = 24; bar3.y = y; bar3.value = 0.3; bar3.color = '#f44336';
    c.addChild(bar3);
    y += 24;

    // ── Section: IconButton ──
    y += 10;
    y = this.addSection(c, 'IconButton + Badge + Tag', y);
    const ibIcons = ['pause', 'settings', 'share', 'gift', 'mission', 'star'] as const;
    ibIcons.forEach((name, i) => {
      const ib = new IconButton({ icon: name as any, size: 40, bgColor: 'rgba(255,255,255,0.12)', badge: i >= 4 ? i : undefined });
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
      { text: '限时', bg: '#e94560' },
      { text: '新品', bg: '#4caf50' },
      { text: 'HOT', bg: '#ff9800' },
    ];
    tags.forEach((t, i) => {
      const tag = new Tag({ text: t.text, bgColor: t.bg });
      tag.x = 16 + i * 64;
      tag.y = y;
      c.addChild(tag);
    });
    y += 36;

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
    const spacer = new UINode({ width: W, height: 40 });
    spacer.y = y;
    c.addChild(spacer);
  }

  private buildBusinessUI() {
    const c = this.bizContainer;
    let y = 0;

    // ── Checkin ──
    y = this.addSection(c, 'CheckinDialog — 签到弹窗', y);
    const checkinBtn = new Button({ text: '打开签到', variant: 'primary', width: 200, height: 44 });
    checkinBtn.x = (W - 200) / 2; checkinBtn.y = y;
    checkinBtn.$on('tap', () => this.showCheckin());
    c.addChild(checkinBtn);
    y += 60;

    // ── Settings ──
    y = this.addSection(c, 'SettingsPanel — 设置面板', y);
    const settingsBtn = new Button({ text: '打开设置', variant: 'secondary', width: 200, height: 44 });
    settingsBtn.x = (W - 200) / 2; settingsBtn.y = y;
    settingsBtn.$on('tap', () => this.showSettings());
    c.addChild(settingsBtn);
    y += 60;

    // ── Result ──
    y = this.addSection(c, 'ResultPanel — 结算页', y);
    const resultBtn = new Button({ text: '打开结算', variant: 'outline', width: 200, height: 44 });
    resultBtn.x = (W - 200) / 2; resultBtn.y = y;
    resultBtn.$on('tap', () => this.showResult());
    c.addChild(resultBtn);
    y += 60;

    // ── Shop ──
    y = this.addSection(c, 'ShopPanel — 商店', y);
    const shopBtn = new Button({ text: '打开商店', variant: 'gold', width: 200, height: 44 });
    shopBtn.x = (W - 200) / 2; shopBtn.y = y;
    shopBtn.$on('tap', () => this.showShop());
    c.addChild(shopBtn);
    y += 60;

    // ── Leaderboard ──
    y = this.addSection(c, 'LeaderboardPanel — 排行榜', y);
    const lbBtn = new Button({ text: '打开排行榜', variant: 'secondary', width: 200, height: 44 });
    lbBtn.x = (W - 200) / 2; lbBtn.y = y;
    lbBtn.$on('tap', () => this.showLeaderboard());
    c.addChild(lbBtn);
    y += 60;

    // ── BattlePass ──
    y = this.addSection(c, 'BattlePassPanel — 战令', y);
    const bpBtn = new Button({ text: '打开战令', variant: 'gold', width: 200, height: 44 });
    bpBtn.x = (W - 200) / 2; bpBtn.y = y;
    bpBtn.$on('tap', () => this.showBattlePass());
    c.addChild(bpBtn);
    y += 60;

    // ── LuckyBox ──
    y = this.addSection(c, 'LuckyBoxDialog — 抽奖', y);
    const luckBtn = new Button({ text: '打开抽奖', variant: 'danger', width: 200, height: 44 });
    luckBtn.x = (W - 200) / 2; luckBtn.y = y;
    luckBtn.$on('tap', () => this.showLuckyBox());
    c.addChild(luckBtn);
    y += 60;

    // ── CoinShop ──
    y = this.addSection(c, 'CoinShopPanel — 金币商店', y);
    const csBtn = new Button({ text: '打开金币商店', variant: 'secondary', width: 200, height: 44 });
    csBtn.x = (W - 200) / 2; csBtn.y = y;
    csBtn.$on('tap', () => this.showCoinShop());
    c.addChild(csBtn);
    y += 60;

    // ── Privacy ──
    y = this.addSection(c, 'PrivacyDialog — 隐私合规', y);
    const privBtn = new Button({ text: '打开隐私弹窗', variant: 'outline', width: 200, height: 44 });
    privBtn.x = (W - 200) / 2; privBtn.y = y;
    privBtn.$on('tap', () => this.showPrivacy());
    c.addChild(privBtn);
    y += 60;

    // Bottom spacer
    const spacer = new UINode({ width: W, height: 60 });
    spacer.y = y;
    c.addChild(spacer);
  }

  private addSection(container: UINode, title: string, y: number): number {
    const label = new Label({ text: title, fontSize: 12, fontWeight: 'bold', color: '#ffd166', align: 'left', width: W, height: 20 });
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
    const modal = new Modal({ id: 'overlay', title: '示例弹窗', screenWidth: W, screenHeight: H, width: 280, height: 220 });
    const desc = new Label({ text: '这是一个 Modal 组件\n支持 open/close 动画', fontSize: 14, color: 'rgba(255,255,255,0.6)', align: 'center', width: 240, height: 40 });
    desc.x = 20; desc.y = 20;
    modal.content.addChild(desc);

    const confirmBtn = new Button({ text: '知道了', variant: 'primary', width: 180, height: 40 });
    confirmBtn.x = 50; confirmBtn.y = 80;
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
        { icon: '🛡', label: '关卡', value: '12' },
        { icon: '🧱', label: '方块', value: '3,456' },
        { icon: '⚡', label: '连击', value: '8x' },
        { icon: '⏱', label: '用时', value: '2:34' },
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

    // Toast update
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

    // Toast 绘制在所有 UI 之上
    Toast.draw(ctx, W, H);

    ctx.restore();
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}
