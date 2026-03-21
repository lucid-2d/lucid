/**
 * Component Gallery — 全组件展示 + 交互试用
 *
 * 使用 Layout 系统自动布局，无手动 x/y 计算
 */

import { SceneNode, SceneRouter } from '../packages/engine/src/index';
import { UINode, Sprite, SpriteSheet, AnimatedSprite, NineSlice, I18n, drawText } from '../packages/core/src/index';
import { ParticlePool, ParticleEmitter, ParticlePresets } from '../packages/physics/src/index';
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

type GalleryTab = 'base' | 'business' | 'sprite' | 'new';

// ── Test image generators (no external files needed) ──

/** Generate a colorful test image (gradient + cross pattern) */
function generateTestImage(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#e94560');
  grad.addColorStop(0.5, '#ffd166');
  grad.addColorStop(1, '#06d6a0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Cross pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(w, h);
  ctx.moveTo(w, 0); ctx.lineTo(0, h);
  ctx.stroke();
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  return c;
}

/** Generate a sprite sheet: 4x2 grid of colored cells with labels */
function generateSpriteSheet(): { canvas: HTMLCanvasElement; sheet: SpriteSheet } {
  const cols = 4, rows = 2, cellW = 64, cellH = 64;
  const c = document.createElement('canvas');
  c.width = cols * cellW; c.height = rows * cellH;
  const ctx = c.getContext('2d')!;

  const colors = ['#e94560', '#06d6a0', '#118ab2', '#ffd166', '#073b4c', '#ef476f', '#26547c', '#fcbf49'];
  const names = ['idle', 'walk1', 'walk2', 'jump', 'fall', 'attack', 'hurt', 'die'];

  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = col * cellW, y = row * cellH;
    // Fill
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, y, cellW, cellH);
    // Character silhouette (simple stick figure)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x + cellW / 2, y + 18, 10, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.fillRect(x + cellW / 2 - 3, y + 28, 6, 20); // body
    // Legs vary by frame
    ctx.fillRect(x + cellW / 2 - 10 + (i % 3) * 4, y + 48, 4, 12);
    ctx.fillRect(x + cellW / 2 + 2 + (i % 2) * 4, y + 48, 4, 12);
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(names[i], x + cellW / 2, y + cellH - 4);
  }

  const sheet = SpriteSheet.fromGrid(c, cols, rows, cellW, cellH, names);
  return { canvas: c, sheet };
}

/** Generate avatar image (circle with face) */
function generateAvatar(size: number, color: string, label: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;
  // Circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(r - 8, r - 4, 4, 0, Math.PI * 2);
  ctx.arc(r + 8, r - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  // Mouth
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r, r + 4, 8, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  // Label below
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(size * 0.18)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(label, r, size - 4);
  return c;
}

/** Generate animated frames (rotating color wheel) */
function generateAnimFrames(count: number, size: number): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    const r = size / 2;
    const angle = (i / count) * Math.PI * 2;
    // Background circle
    ctx.fillStyle = `hsl(${(i / count) * 360}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(r, r, r - 2, 0, Math.PI * 2);
    ctx.fill();
    // Rotating indicator
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.lineTo(r + Math.cos(angle) * (r - 6), r + Math.sin(angle) * (r - 6));
    ctx.stroke();
    // Frame number
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, r, r);
    frames.push(c);
  }
  return frames;
}

/** Generate 9-slice panel image */
function generateNineSliceImage(w: number, h: number, inset: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  // Border
  ctx.fillStyle = '#3a3a6e';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, inset);
  ctx.fill();
  // Inner fill
  ctx.fillStyle = '#1a1a3e';
  ctx.beginPath();
  ctx.roundRect(inset / 2, inset / 2, w - inset, h - inset, inset / 2);
  ctx.fill();
  // Corner markers
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(inset, 0); ctx.lineTo(inset, h);
  ctx.moveTo(w - inset, 0); ctx.lineTo(w - inset, h);
  ctx.moveTo(0, inset); ctx.lineTo(w, inset);
  ctx.moveTo(0, h - inset); ctx.lineTo(w, h - inset);
  ctx.stroke();
  ctx.setLineDash([]);
  return c;
}

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
  private spriteScroll!: ScrollView;
  private newScroll!: ScrollView;
  private demoProgress = 0;
  private particlePool!: ParticlePool;
  private fireEmitter!: ParticleEmitter;
  private trailEmitter!: ParticleEmitter;

  onEnter() {
    // Top tab bar
    this.topTabBar = new TabBar({
      id: 'gallery-tabs',
      tabs: [
        { key: 'base', label: 'Base UI' },
        { key: 'business', label: 'Business' },
        { key: 'sprite', label: 'Sprite' },
        { key: 'new', label: 'New ✦' },
      ],
      activeKey: 'base', width: W, height: 36,
    });
    this.topTabBar.y = 8;
    this.topTabBar.$on('change', (key: string) => {
      this.galleryTab = key as GalleryTab;
      this.baseScroll.visible = key === 'base';
      this.bizScroll.visible = key === 'business';
      this.spriteScroll.visible = key === 'sprite';
      this.newScroll.visible = key === 'new';
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

    // Sprite scroll
    this.spriteScroll = new ScrollView({ id: 'sprite-scroll', width: W, height: H - 50 });
    this.spriteScroll.y = 50;
    this.spriteScroll.visible = false;
    this.addChild(this.spriteScroll);
    this.spriteScroll.contentHeight = this.buildSpriteUI(this.spriteScroll.content);

    // New features scroll
    this.newScroll = new ScrollView({ id: 'new-scroll', width: W, height: H - 50 });
    this.newScroll.y = 50;
    this.newScroll.visible = false;
    this.addChild(this.newScroll);
    this.newScroll.contentHeight = this.buildNewFeaturesUI(this.newScroll.content);
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

  // ── Sprite UI ──

  private buildSpriteUI(c: UINode): number {
    const col = new UINode({ id: 'sprite-col', width: W, layout: 'column', gap: 14 });

    // 1. Basic Sprite — different sizes
    const sec1 = section('Sprite — 基础图片（代码生成）');
    const testImg = generateTestImage(128, 128);
    const sizeRow = new UINode({ width: W - 32, layout: 'row', gap: 12, alignItems: 'end' });
    for (const size of [32, 48, 64, 80]) {
      const wrapper = new UINode({ width: size, layout: 'column', alignItems: 'center', gap: 4 });
      wrapper.addChild(new Sprite({ image: testImg, width: size, height: size }));
      wrapper.addChild(new Label({ text: `${size}px`, fontSize: 9, color: UIColors.textHint, align: 'center', width: size, height: 12 }));
      sizeRow.addChild(wrapper);
    }
    sec1.addChild(sizeRow);
    col.addChild(sec1);

    // 2. SpriteSheet — 8 frames from grid
    const sec2 = section('SpriteSheet — 精灵图集（4x2 网格）');
    const { canvas: sheetCanvas, sheet } = generateSpriteSheet();

    // Show the full sheet
    const sheetRow = new UINode({ width: W - 32, layout: 'column', alignItems: 'center', gap: 8 });
    sheetRow.addChild(new Sprite({ id: 'full-sheet', image: sheetCanvas, width: 256, height: 128 }));
    sheetRow.addChild(new Label({ text: '完整图集 (256x128)', fontSize: 10, color: UIColors.textHint, align: 'center', width: 200, height: 14 }));
    sec2.addChild(sheetRow);

    // Show individual frames extracted from sheet
    const frameRow = new UINode({ width: W - 32, layout: 'row', wrap: true, columns: 4, gap: 8 });
    for (const name of sheet.regionNames) {
      const cell = new UINode({ width: 80, layout: 'column', alignItems: 'center', gap: 2 });
      cell.addChild(sheet.createSprite(name, { width: 48, height: 48 }));
      cell.addChild(new Label({ text: name, fontSize: 9, color: UIColors.textSecondary, align: 'center', width: 80, height: 12 }));
      frameRow.addChild(cell);
    }
    sec2.addChild(frameRow);
    col.addChild(sec2);

    // 3. Flip — flipX / flipY
    const sec3 = section('Flip — 翻转');
    const flipRow = new UINode({ width: W - 32, layout: 'row', gap: 16, justifyContent: 'center', alignItems: 'end' });
    const flipImg = generateTestImage(64, 64);
    const flips: Array<{ label: string; fx: boolean; fy: boolean }> = [
      { label: '原图', fx: false, fy: false },
      { label: 'flipX', fx: true, fy: false },
      { label: 'flipY', fx: false, fy: true },
      { label: 'flipXY', fx: true, fy: true },
    ];
    for (const f of flips) {
      const wrapper = new UINode({ width: 64, layout: 'column', alignItems: 'center', gap: 4 });
      wrapper.addChild(new Sprite({ image: flipImg, width: 56, height: 56, flipX: f.fx, flipY: f.fy }));
      wrapper.addChild(new Label({ text: f.label, fontSize: 9, color: UIColors.textHint, align: 'center', width: 64, height: 12 }));
      flipRow.addChild(wrapper);
    }
    sec3.addChild(flipRow);
    col.addChild(sec3);

    // 4. Avatar grid — layout + sprite combined
    const sec4 = section('Layout + Sprite — 头像网格');
    const avatarColors = ['#e94560', '#06d6a0', '#118ab2', '#ffd166', '#ef476f', '#073b4c'];
    const avatarNames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];
    const avatarGrid = new UINode({ width: W - 32, layout: 'row', wrap: true, columns: 3, gap: 12 });
    for (let i = 0; i < 6; i++) {
      const card = new UINode({
        width: 100, layout: 'column', alignItems: 'center', gap: 6,
        padding: [8, 0, 8, 0],
      });
      // Card background (drawn via custom draw)
      const avatar = generateAvatar(56, avatarColors[i], avatarNames[i]);
      card.addChild(new Sprite({ id: `avatar-${i}`, image: avatar, width: 56, height: 56 }));
      card.addChild(new Label({ text: avatarNames[i], fontSize: 12, color: UIColors.text, align: 'center', width: 80, height: 16 }));
      card.addChild(new Label({ text: `Lv.${10 + i * 3}`, fontSize: 10, color: UIColors.textMuted, align: 'center', width: 80, height: 14 }));
      avatarGrid.addChild(card);
    }
    sec4.addChild(avatarGrid);
    col.addChild(sec4);

    // 5. Sprite + Button — item shop style
    const sec5 = section('Sprite + UI — 道具卡片');
    const itemRow = new UINode({ width: W - 32, layout: 'row', gap: 10, justifyContent: 'center' });
    const itemData = [
      { name: '生命药水', color: '#e94560', price: '100' },
      { name: '魔法卷轴', color: '#118ab2', price: '250' },
      { name: '金色钥匙', color: '#ffd166', price: '500' },
    ];
    for (const item of itemData) {
      const card = new UINode({ width: 100, layout: 'column', alignItems: 'center', gap: 6, padding: 10 });
      const itemImg = generateAvatar(48, item.color, '');
      card.addChild(new Sprite({ image: itemImg, width: 48, height: 48 }));
      card.addChild(new Label({ text: item.name, fontSize: 11, color: UIColors.text, align: 'center', width: 90, height: 14 }));
      const buyBtn = new Button({ text: `${item.price}`, variant: 'gold', width: 80, height: 28 });
      buyBtn.$on('tap', () => Toast.show('reward', `购买 ${item.name}!`));
      card.addChild(buyBtn);
      itemRow.addChild(card);
    }
    sec5.addChild(itemRow);
    col.addChild(sec5);

    c.addChild(col);
    return this.measureColumnHeight(col) + 60;
  }

  // ── New Features UI (P4-P7) ──

  private buildNewFeaturesUI(c: UINode): number {
    const col = new UINode({ id: 'new-col', width: W, layout: 'column', gap: 14 });

    // 1. AnimatedSprite
    const animSec = section('AnimatedSprite — 帧序列动画');
    const animRow = new UINode({ width: W - 32, layout: 'row', gap: 20, alignItems: 'center', justifyContent: 'center' });

    // Loop mode
    const loopFrames = generateAnimFrames(12, 64);
    const loopAnim = AnimatedSprite.fromImages(loopFrames, {
      id: 'anim-loop', width: 64, height: 64, fps: 8,
    });
    const loopCol = new UINode({ layout: 'column', alignItems: 'center', gap: 4, width: 80 });
    loopCol.addChild(loopAnim);
    loopCol.addChild(new Label({ text: 'loop 8fps', fontSize: 9, color: UIColors.textHint, align: 'center', width: 80, height: 12 }));
    animRow.addChild(loopCol);

    // Pingpong
    const ppFrames = generateAnimFrames(8, 64);
    const ppAnim = AnimatedSprite.fromImages(ppFrames, {
      id: 'anim-pp', width: 64, height: 64, fps: 6, mode: 'pingpong',
    });
    const ppCol = new UINode({ layout: 'column', alignItems: 'center', gap: 4, width: 80 });
    ppCol.addChild(ppAnim);
    ppCol.addChild(new Label({ text: 'pingpong 6fps', fontSize: 9, color: UIColors.textHint, align: 'center', width: 80, height: 12 }));
    animRow.addChild(ppCol);

    // Fast
    const fastFrames = generateAnimFrames(24, 64);
    const fastAnim = AnimatedSprite.fromImages(fastFrames, {
      id: 'anim-fast', width: 64, height: 64, fps: 24,
    });
    const fastCol = new UINode({ layout: 'column', alignItems: 'center', gap: 4, width: 80 });
    fastCol.addChild(fastAnim);
    fastCol.addChild(new Label({ text: 'loop 24fps', fontSize: 9, color: UIColors.textHint, align: 'center', width: 80, height: 12 }));
    animRow.addChild(fastCol);

    animSec.addChild(animRow);
    col.addChild(animSec);

    // 2. NineSlice
    const nsSec = section('NineSlice — 九宫格拉伸');
    const nsImg = generateNineSliceImage(48, 48, 12);
    const nsRow = new UINode({ width: W - 32, layout: 'column', gap: 10, alignItems: 'center' });

    const sizes: Array<[number, number, string]> = [[120, 50, '120×50'], [250, 40, '250×40'], [300, 100, '300×100']];
    for (const [w, h, label] of sizes) {
      const wrap = new UINode({ layout: 'column', alignItems: 'center', gap: 4, width: W - 32 });
      wrap.addChild(new NineSlice({ image: nsImg, insets: [12, 12, 12, 12], width: w, height: h }));
      wrap.addChild(new Label({ text: `${label} (corners preserved)`, fontSize: 9, color: UIColors.textHint, align: 'center', width: 200, height: 12 }));
      nsRow.addChild(wrap);
    }
    nsSec.addChild(nsRow);
    col.addChild(nsSec);

    // 3. Text wrapping
    const textSec = section('Text Wrapping — 自动换行 + 省略号');
    const textCol = new UINode({ width: W - 32, layout: 'column', gap: 12 });

    // Wrapped text
    const wrapLabel = new Label({
      text: 'This is a long text that demonstrates automatic line wrapping. 中英文混排也能正确处理，框架会在合适的位置断行。',
      fontSize: 14, color: UIColors.text, width: W - 64, height: 80,
      wrap: true, verticalAlign: 'top',
    });
    textCol.addChild(wrapLabel);

    // MaxLines with ellipsis
    const ellipsisLabel = new Label({
      text: 'maxLines=2: This text is intentionally very long so that it will be truncated after exactly two lines with an ellipsis indicator at the end of the second line.',
      fontSize: 13, color: UIColors.textMuted, width: W - 64, height: 44,
      wrap: true, maxLines: 2, verticalAlign: 'top',
    });
    textCol.addChild(ellipsisLabel);

    textSec.addChild(textCol);
    col.addChild(textSec);

    // 4. Particles
    const particleSec = section('Particles — 粒子预设 (点击触发爆炸)');

    // Particle canvas area
    this.particlePool = new ParticlePool(300);
    this.fireEmitter = new ParticleEmitter(this.particlePool, ParticlePresets.fire({ color: '#ff6b35' }));
    this.fireEmitter.x = 80;
    this.fireEmitter.y = 0; // will be set relative to particle area
    this.trailEmitter = new ParticleEmitter(this.particlePool, ParticlePresets.trail({ color: '#6c5ce7' }));
    this.trailEmitter.x = W - 80;
    this.trailEmitter.y = 0;

    const particleArea = new ParticleAreaNode(W - 32, 160, this.particlePool, this.fireEmitter, this.trailEmitter);
    particleArea.interactive = true;
    particleArea.$on('touchstart', () => {});
    particleArea.$on('touchend', (e: any) => {
      this.particlePool.emit(e.localX, e.localY, ParticlePresets.explosion({ color: '#ffd166' }));
    });
    particleSec.addChild(particleArea);

    const particleInfo = new UINode({ width: W - 32, layout: 'row', gap: 8, justifyContent: 'center' });
    particleInfo.addChild(new Label({ text: '🔥 Fire', fontSize: 11, color: '#ff6b35', width: 60, height: 16 }));
    particleInfo.addChild(new Label({ text: '💜 Trail', fontSize: 11, color: '#6c5ce7', width: 60, height: 16 }));
    particleInfo.addChild(new Label({ text: '👆 Tap=Explosion', fontSize: 11, color: '#ffd166', width: 120, height: 16 }));
    particleSec.addChild(particleInfo);
    col.addChild(particleSec);

    // 5. I18n
    const i18nSec = section('I18n — 国际化');
    const i18n = new I18n({
      en: { title: 'Hello World', score: 'Score: {0}', play: 'Play Game' },
      zh: { title: '你好世界', score: '得分: {0}', play: '开始游戏' },
      ja: { title: 'こんにちは世界', score: 'スコア: {0}', play: 'ゲーム開始' },
    });

    const i18nCol = new UINode({ width: W - 32, layout: 'column', gap: 8 });
    const i18nLabels: Label[] = [];

    const updateI18nLabels = () => {
      i18nLabels[0].text = `[${i18n.locale}] ${i18n.t('title')}`;
      i18nLabels[1].text = i18n.t('score', 12800);
      i18nLabels[2].text = i18n.t('play');
    };

    for (let i = 0; i < 3; i++) {
      const l = new Label({ text: '', fontSize: 16, color: UIColors.text, width: W - 64, height: 22 });
      i18nLabels.push(l);
      i18nCol.addChild(l);
    }

    const langRow = new UINode({ width: W - 32, layout: 'row', gap: 8, justifyContent: 'center' });
    for (const lang of ['en', 'zh', 'ja']) {
      const btn = new Button({ text: lang.toUpperCase(), variant: i18n.locale === lang ? 'primary' : 'outline', width: 70, height: 32 });
      btn.$on('tap', () => {
        i18n.locale = lang;
        updateI18nLabels();
      });
      langRow.addChild(btn);
    }
    i18nCol.addChild(langRow);
    i18nSec.addChild(i18nCol);
    col.addChild(i18nSec);

    updateI18nLabels();

    c.addChild(col);
    // Generous estimate — sections with custom nodes need more space
    return 1200;
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

    // Update particles if visible
    if (this.particlePool && this.galleryTab === 'new') {
      this.fireEmitter.update(0.016);
      this.trailEmitter.update(0.016);
      this.particlePool.update(0.016);
    }
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

/** Custom UINode that draws particles in a bounded area */
class ParticleAreaNode extends UINode {
  private pool: ParticlePool;
  private fire: ParticleEmitter;
  private trail: ParticleEmitter;
  private _time = 0;

  constructor(w: number, h: number, pool: ParticlePool, fire: ParticleEmitter, trail: ParticleEmitter) {
    super({ id: 'particle-area', width: w, height: h });
    this.pool = pool;
    this.fire = fire;
    this.trail = trail;
    this.fire.y = h - 10;
    this.trail.y = h - 10;
  }

  $update(dt: number): void {
    super.$update(dt);
    this._time += dt;
    // Move trail emitter in a wave
    this.trail.x = this.width - 80 + Math.sin(this._time * 2) * 40;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // Dark background
    ctx.fillStyle = 'rgba(10, 10, 30, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 8);
    ctx.fill();

    // Clip to area
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 8);
    ctx.clip();

    this.pool.draw(ctx);
    ctx.restore();
  }
}
