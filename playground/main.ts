/**
 * Lucid Playground — 框架示例项目 + 组件展示
 */

import { createApp, SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import { Button, Label, Modal, ProgressBar, Toggle, TabBar, ScrollView } from '../packages/ui/src/index';
import { CheckinDialog, SettingsPanel, ResultPanel, ShopPanel, type ShopItem } from '../packages/game-ui/src/index';
import { ParticlePool } from '../packages/physics/src/index';

const W = 390, H = 844;

// ── 初始化 ──────────────────────────────────

const canvas = document.getElementById('game') as HTMLCanvasElement;
const app = createApp({ platform: 'web', canvas, debug: true });
(window as any)._app = app;

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

// ── 菜单场景 ─────────────────────────────────

class MenuScene extends SceneNode {
  private floaters: Array<{ x: number; y: number; vx: number; vy: number; r: number; color: string }> = [];

  onEnter() {
    for (let i = 0; i < 12; i++) {
      this.floaters.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
        r: 2 + Math.random() * 5,
        color: ['#e94560', '#118ab2', '#ffd166', '#06d6a0'][Math.floor(Math.random() * 4)],
      });
    }

    const title = new Label({ id: 'title', text: 'Lucid', fontSize: 42, fontWeight: 'bold', color: '#ffd166', align: 'center', width: W, height: 50 });
    title.y = 180;
    this.addChild(title);

    const subtitle = new Label({ text: 'AI-first Canvas 2D Game Framework', fontSize: 13, color: 'rgba(255,255,255,0.4)', align: 'center', width: W, height: 20 });
    subtitle.y = 235;
    this.addChild(subtitle);

    // 按钮组
    const btnDefs = [
      { id: 'play', text: '开始游戏', variant: 'primary' as const, action: () => app.router.replace(new PlayScene({ id: 'play' })) },
      { id: 'shop', text: '商店', variant: 'secondary' as const, action: () => this.showOverlay('shop') },
      { id: 'checkin', text: '每日签到', variant: 'outline' as const, action: () => this.showOverlay('checkin') },
      { id: 'settings', text: '设置', variant: 'ghost' as const, action: () => this.showOverlay('settings') },
    ];

    btnDefs.forEach((b, i) => {
      const btn = new Button({ id: b.id, text: b.text, variant: b.variant, width: 220, height: 48 });
      btn.x = (W - 220) / 2;
      btn.y = 340 + i * 62;
      btn.$on('tap', b.action);
      this.addChild(btn);
    });

    const footer = new Label({ text: '197 tests · 5 packages · 0 dependencies', fontSize: 11, color: 'rgba(255,255,255,0.25)', align: 'center', width: W, height: 20 });
    footer.y = H - 40;
    this.addChild(footer);
  }

  private showOverlay(type: string) {
    // 移除旧 overlay
    const old = this.findById('overlay');
    if (old) old.removeFromParent();

    if (type === 'shop') {
      const shop = new ShopPanel({
        id: 'overlay',
        tabs: [{ key: 'skin', label: '弹球皮肤' }, { key: 'effect', label: '消除特效' }],
        items: shopItems,
      });
      shop.$on('close', () => shop.removeFromParent());
      shop.$on('equip', (item: ShopItem) => console.log('[equip]', item.id));
      shop.$on('purchase', (item: ShopItem) => console.log('[purchase]', item.id));
      this.addChild(shop);
    } else if (type === 'checkin') {
      const checkin = new CheckinDialog({ rewards: [10, 10, 15, 20, 20, 25, 50], currentDay: 3, claimed: false });
      checkin.id = 'overlay';
      checkin.$on('claim', (day: number, reward: number) => {
        console.log(`[签到] 第${day + 1}天 +${reward}金币`);
        checkin.close();
        checkin.removeFromParent();
      });
      checkin.$on('close', () => checkin.removeFromParent());
      this.addChild(checkin);
    } else if (type === 'settings') {
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
      settings.$on('toggle', (id: string, val: boolean) => console.log('[toggle]', id, val));
      settings.$on('close', () => settings.removeFromParent());
      this.addChild(settings);
    }
  }

  onBeforeUpdate() {
    for (const f of this.floaters) {
      f.x += f.vx * 0.016;
      f.y += f.vy * 0.016;
      if (f.x < 0 || f.x > W) f.vx *= -1;
      if (f.y < 0 || f.y > H) f.vy *= -1;
    }
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    drawBg(ctx);
    for (const f of this.floaters) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
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
        { icon: '🧱', label: '消除方块', value: String(25 - this.blocks.length) },
        { icon: '⭐', label: '得分', value: String(this.score) },
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

app.router.push(new MenuScene({ id: 'menu' }));
app.start();

console.log('%c[Lucid] Playground started', 'color: #ffd166; font-weight: bold');
console.log(app.root.$inspect());

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
// 实时刷新 inspect
setInterval(() => {
  const btn = document.querySelector('.debug-panel button.active');
  if (btn?.textContent?.includes('inspect')) {
    document.getElementById('debug-output')!.textContent = app.root.$inspect();
  }
}, 500);
