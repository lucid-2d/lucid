/**
 * Lucid Playground — 框架示例项目 + 组件展示
 */

import { createApp, SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import { Label, Modal, Button, ScrollView } from '../packages/ui/src/index';
import { ResultPanel, createScene, type ShopItem } from '../packages/game-ui/src/index';
import { ParticlePool } from '../packages/physics/src/index';

const W = 390, H = 844;

// ── 初始化 ──────────────────────────────────

const canvas = document.getElementById('game') as HTMLCanvasElement;
const app = createApp({ platform: 'web', canvas, debug: true });
(window as any)._app = app;
(window as any).__createScene = createScene;

// ── 共享数据 ─────────────────────────────────

const shopItems: ShopItem[] = [
  { id: 'default', name: '默认球', desc: '经典白色', icon: '⚪', category: 'skin', owned: true, equipped: true },
  { id: 'rainbow', name: '彩虹球', desc: '色相旋转', icon: '🌈', category: 'skin', owned: true, equipped: false },
  { id: 'flame', name: '火焰球', desc: '橙红光晕', icon: '🔥', category: 'skin', owned: false, equipped: false, price: '500' },
  { id: 'frost', name: '冰霜球', desc: '冰蓝光晕', icon: '❄️', category: 'skin', owned: false, equipped: false, price: '500' },
  { id: 'sakura', name: '樱花', desc: '粉色飘落', icon: '🌸', category: 'effect', owned: true, equipped: false },
  { id: 'lightning', name: '雷电', desc: '金色电弧', icon: '⚡', category: 'effect', owned: true, equipped: true },
  { id: 'pixel', name: '像素', desc: '方块爆碎', icon: '🟩', category: 'effect', owned: false, equipped: false, price: '800' },
];

const particles = new ParticlePool(200);

// ── 工具：绘制渐变背景 ─────────────────────────

function drawBg(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ── 菜单场景（使用 MenuTemplate）─────────────────

function createMenuScene() {
  let soundOn = true;
  let vibrationOn = false;

  return createScene(app, {
    template: 'menu',
    title: 'Lucid',
    subtitle: 'AI-first Canvas 2D Game Framework',
    bestScore: 2480,
    stats: [
      { icon: 'shield', label: '已玩', value: '42' },
      { icon: 'shield', label: '最远', value: '15' },
      { icon: 'block', label: '消除', value: '1200' },
      { icon: 'lightning', label: '连击', value: '8' },
    ],

    play: () => app.router.replace(new PlayScene({ id: 'play' })),
    settings: {
      toggles: [
        { id: 'sound', label: '音效', value: true },
        { id: 'music', label: '音乐', value: true },
        { id: 'vibration', label: '振动', value: false },
      ],
      onToggle: (id, val) => console.log('[toggle]', id, val),
    },
    privacy: { content: '我们重视您的隐私保护。本游戏不收集任何个人信息。使用本游戏即表示您同意本隐私协议。' },

    zoneC: [
      { id: 'shop', onTap: () => app.router.push(createShopScene()) },
      { id: 'leaderboard', onTap: () => app.router.push(createLeaderboardScene()) },
    ],

    toggles: [
      { id: 'sound', icon: 'sound-on', offIcon: 'sound-off', value: soundOn, onChange: (v) => { soundOn = v; } },
      { id: 'vibration', icon: 'vibrate', value: vibrationOn, onChange: (v) => { vibrationOn = v; } },
    ],

    zoneD: [
      { id: 'checkin' },
      { id: 'achievements', icon: 'achievement', text: '成就', onTap: () => console.log('[achievements]') },
    ],

    checkin: { rewards: [10, 15, 20, 25, 30, 40, 80], currentDay: 3, claimed: false, onClaim: () => console.log('[checkin claim]') },

    version: 'v0.5.0',

    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 商店场景（使用 ShopTemplate）─────────────────

function createShopScene() {
  return createScene(app, {
    template: 'shop',
    variant: 'skin',
    back: () => app.router.pop(),
    tabs: [{ key: 'skin', label: '弹球皮肤' }, { key: 'effect', label: '消除特效' }],
    items: shopItems,
    onPurchase: (item) => console.log('[purchase]', item.id),
    onEquip: (item) => console.log('[equip]', item.id),
    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 排行榜场景（使用 ListTemplate）─────────────────

function createLeaderboardScene() {
  return createScene(app, {
    template: 'list',
    variant: 'leaderboard',
    back: () => app.router.pop(),
    tabs: [{ key: 'friends', label: '好友' }, { key: 'global', label: '全服' }],
    entries: [
      { rank: 1, name: '玩家 A', score: 9800 },
      { rank: 2, name: '玩家 B', score: 7200 },
      { rank: 3, name: '玩家 C', score: 5100 },
      { rank: 4, name: '你', score: 2480, isMe: true },
      { rank: 5, name: '玩家 D', score: 1900 },
    ],
    myEntry: { rank: 4, name: '你', score: 2480, isMe: true },
    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 游戏场景 ─────────────────────────────────

class PlayScene extends SceneNode {
  private ballX = W / 2;
  private ballY = 600;
  private ballVx = 130;
  private ballVy = -220;
  private score = 0;
  private scoreLabel!: Label;
  private blocks: Array<{ x: number; y: number; w: number; h: number; color: string; hp: number }> = [];

  onEnter() {
    const colors = ['#e94560', '#ff6b6b', '#ffa502', '#ffd166', '#06d6a0', '#118ab2'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        this.blocks.push({
          x: 15 + col * 74, y: 100 + row * 36,
          w: 66, h: 28, color: colors[row], hp: 1 + row,
        });
      }
    }

    this.scoreLabel = new Label({ id: 'score', text: '0', fontSize: 20, fontWeight: 'bold', color: '#ffd166', align: 'center', width: W, height: 30 });
    this.scoreLabel.y = 50;
    this.addChild(this.scoreLabel);

    const pauseBtn = new Button({ id: 'pause', text: '⏸', variant: 'ghost', width: 36, height: 36 });
    pauseBtn.x = 8; pauseBtn.y = 48;
    pauseBtn.$on('tap', () => this.showPause());
    this.addChild(pauseBtn);
  }

  private showPause() {
    const modal = new Modal({ id: 'pause-modal', title: '暂停', screenWidth: W, screenHeight: H, width: 260, height: 200 });
    const resumeBtn = new Button({ text: '继续游戏', variant: 'primary', width: 180, height: 44 });
    resumeBtn.x = 40; resumeBtn.y = 20;
    resumeBtn.$on('tap', () => { modal.close(); modal.removeFromParent(); });
    modal.content.addChild(resumeBtn);

    const menuBtn = new Button({ text: '返回菜单', variant: 'outline', width: 180, height: 44 });
    menuBtn.x = 40; menuBtn.y = 80;
    menuBtn.$on('tap', () => app.router.replace(new MenuScene({ id: 'menu' })));
    modal.content.addChild(menuBtn);

    modal.open();
    this.addChild(modal);
  }

  onBeforeUpdate() {
    const dt = 0.016;
    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;

    if (this.ballX < 8 || this.ballX > W - 8) { this.ballVx *= -1; this.ballX = Math.max(8, Math.min(W - 8, this.ballX)); }
    if (this.ballY < 80) { this.ballVy = Math.abs(this.ballVy); }

    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (this.ballX + 6 > b.x && this.ballX - 6 < b.x + b.w && this.ballY + 6 > b.y && this.ballY - 6 < b.y + b.h) {
        b.hp--;
        this.ballVy *= -1;
        this.score += 10;
        particles.emit(this.ballX, this.ballY, { count: 6, speed: 80, color: b.color, lifetime: 0.3 });
        if (b.hp <= 0) {
          this.blocks.splice(i, 1);
          this.score += 50;
          particles.emit(b.x + b.w / 2, b.y + b.h / 2, { count: 12, speed: 120, color: b.color, lifetime: 0.5, gravity: 200 });
        }
        this.scoreLabel.text = String(this.score);
        break;
      }
    }

    if (this.ballY > H + 10) {
      this.showResult();
      return;
    }

    particles.update(dt);
  }

  private showResult() {
    const result = new ResultPanel({
      title: this.blocks.length === 0 ? '全部消除！' : '游戏结束',
      score: this.score,
      isNewBest: this.score > 300,
      stats: [
        { icon: 'block', label: '消除方块', value: String(25 - this.blocks.length) },
        { icon: 'star', label: '得分', value: String(this.score) },
      ],
      buttons: [
        { id: 'retry', label: '再来一次', variant: 'primary' },
        { id: 'menu', label: '返回菜单', variant: 'outline' },
      ],
    });
    result.$on('action', (id: string) => {
      if (id === 'retry') app.router.replace(new PlayScene({ id: 'play' }));
      if (id === 'menu') app.router.replace(new MenuScene({ id: 'menu' }));
    });

    const scene = new SceneNode({ id: 'result-scene' });
    scene.addChild(result);
    // 给 result 场景加背景绘制
    (scene as any)._drawBg = true;
    const origDraw = scene['draw'].bind(scene);
    scene['draw'] = (ctx: CanvasRenderingContext2D) => { drawBg(ctx); origDraw(ctx); };
    app.router.replace(scene);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    drawBg(ctx);

    // Blocks
    for (const b of this.blocks) {
      ctx.globalAlpha = 0.4 + 0.6 * (b.hp / 5);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.hp), b.x + b.w / 2, b.y + b.h / 2);
    }
    ctx.globalAlpha = 1;

    // Ball
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Ball glow
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Particles
    for (const p of particles.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ── 启动 ─────────────────────────────────────

import { GalleryScene } from './gallery';

// ── 场景切换 ─────────────────────────────────

let currentMode = 'demo';

function switchToDemo() {
  app.router.replace(createMenuScene());
  currentMode = 'demo';
}

function switchToGallery() {
  app.router.replace(new GalleryScene({ id: 'gallery' }));
  currentMode = 'gallery';
}

(window as any).switchScene = (mode: string) => {
  if (mode === 'demo') switchToDemo();
  else switchToGallery();

  document.querySelectorAll('.scene-switcher button').forEach((btn, i) => {
    const modes = ['demo', 'gallery'];
    btn.classList.toggle('active', modes[i] === mode);
  });
};

// ── 启动 ─────────────────────────────────────

app.router.push(createMenuScene());
app.start();

// 鼠标滚轮支持（Gallery 滚动）
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const sv = (app.root.findById('base-scroll') ?? app.root.findById('biz-scroll')) as ScrollView | null;
  if (sv && sv.visible) {
    sv.scrollTo(sv.scrollY + e.deltaY);
  }
}, { passive: false });

console.log('%c[Lucid] Playground started', 'color: #ffd166; font-weight: bold');

// ── Debug Panel 接口 ─────────────────────────

(window as any).showInspect = () => {
  document.getElementById('debug-output')!.textContent = app.root.$inspect();
};
(window as any).showInteractions = () => {
  const log = app.dumpInteractions();
  document.getElementById('debug-output')!.textContent = log.length === 0
    ? '(无交互记录 — 点击游戏画面产生记录)'
    : JSON.stringify(log, null, 2);
};
(window as any).clearInteractions = () => {
  app.clearInteractions();
  document.getElementById('debug-output')!.textContent = '(已清空)';
};
(window as any).showFps = () => {
  const update = () => {
    document.getElementById('debug-output')!.textContent = `FPS: ${app.fps}`;
  };
  update();
  setInterval(update, 500);
};
(window as any).replayInteractions = async () => {
  const records = app.dumpInteractions();
  if (records.length === 0) {
    document.getElementById('debug-output')!.textContent = '(无录制数据可回放)';
    return;
  }
  const output = document.getElementById('debug-output')!;
  output.textContent = `回放中... (${records.length} 步)`;
  const steps = await app.replay(records);
  output.textContent = JSON.stringify(steps.map(s => ({
    step: s.step,
    t: `${s.t}ms`,
    dt: `+${s.dt}ms`,
    type: s.type,
    path: s.actualPath,
    match: s.pathMatch,
    node: s.snapshot,
  })), null, 2);
};
