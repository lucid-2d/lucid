/**
 * Lucid Demo — 展示框架全部能力
 *
 * 包含：菜单场景 → 游戏场景 → 结算场景 → 商店 → 签到 → 设置
 */

import { createApp, SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import { Button, Label, Modal, ProgressBar, Toggle, TabBar } from '../packages/ui/src/index';
import { CheckinDialog, SettingsPanel, ResultPanel, ShopPanel, type ShopItem } from '../packages/game-ui/src/index';
import { vec2, ParticlePool } from '../packages/physics/src/index';

// ── 初始化 ──────────────────────────────────

const canvas = document.getElementById('game') as HTMLCanvasElement;
const app = createApp({ platform: 'web', canvas, debug: true });

// 暴露给 debug panel
(window as any)._app = app;

// ── 商品数据 ─────────────────────────────────

const shopItems: ShopItem[] = [
  { id: 'default', name: '默认球', desc: '经典白色', icon: '⚪', category: 'skin', owned: true, equipped: true },
  { id: 'rainbow', name: '彩虹球', desc: '色相旋转', icon: '🌈', category: 'skin', owned: true, equipped: false },
  { id: 'flame', name: '火焰球', desc: '橙红光晕', icon: '🔥', category: 'skin', owned: false, equipped: false, price: '500' },
  { id: 'frost', name: '冰霜球', desc: '冰蓝光晕', icon: '❄️', category: 'skin', owned: false, equipped: false, price: '500' },
  { id: 'sakura', name: '樱花', desc: '粉色飘落', icon: '🌸', category: 'effect', owned: true, equipped: false },
  { id: 'lightning', name: '雷电', desc: '金色电弧', icon: '⚡', category: 'effect', owned: true, equipped: true },
  { id: 'pixel', name: '像素', desc: '方块爆碎', icon: '🟩', category: 'effect', owned: false, equipped: false, price: '800' },
];

// ── 粒子系统 ─────────────────────────────────

const particles = new ParticlePool(200);

// ── 菜单场景 ─────────────────────────────────

class MenuScene extends SceneNode {
  private floaters: Array<{ x: number; y: number; vx: number; vy: number; r: number; color: string }> = [];
  private time = 0;

  onEnter() {
    // 背景漂浮物
    for (let i = 0; i < 15; i++) {
      this.floaters.push({
        x: Math.random() * 390, y: Math.random() * 844,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
        r: 3 + Math.random() * 6,
        color: ['#e94560', '#118ab2', '#ffd166', '#06d6a0'][Math.floor(Math.random() * 4)],
      });
    }

    // 标题
    const title = new Label({ id: 'title', text: 'Lucid Demo', fontSize: 36, fontWeight: 'bold', color: '#ffd166', align: 'center', width: 390, height: 50 });
    title.x = 0; title.y = 200;
    this.addChild(title);

    const subtitle = new Label({ id: 'subtitle', text: 'AI-first Canvas 2D Game Framework', fontSize: 14, color: 'rgba(255,255,255,0.5)', align: 'center', width: 390, height: 30 });
    subtitle.x = 0; subtitle.y = 250;
    this.addChild(subtitle);

    // 按钮
    const buttons = [
      { id: 'play', text: '开始游戏', variant: 'primary' as const, action: () => app.router.replace(new PlayScene({ id: 'play' })) },
      { id: 'shop', text: '商店', variant: 'secondary' as const, action: () => this.openShop() },
      { id: 'checkin', text: '每日签到', variant: 'outline' as const, action: () => this.openCheckin() },
      { id: 'settings', text: '设置', variant: 'ghost' as const, action: () => this.openSettings() },
    ];

    buttons.forEach((b, i) => {
      const btn = new Button({ id: b.id, text: b.text, variant: b.variant, width: 220, height: 48 });
      btn.x = 85; btn.y = 380 + i * 64;
      btn.$on('tap', b.action);
      this.addChild(btn);
    });

    // 底部 stats
    const stats = new Label({ text: '197 tests | 5 packages | 0 dependencies', fontSize: 11, color: 'rgba(255,255,255,0.3)', align: 'center', width: 390, height: 20 });
    stats.x = 0; stats.y = 790;
    this.addChild(stats);
  }

  private openShop() {
    const shop = new ShopPanel({
      tabs: [{ key: 'skin', label: '弹球皮肤' }, { key: 'effect', label: '消除特效' }],
      items: shopItems,
    });
    shop.$on('equip', (item: ShopItem) => { console.log('equip:', item.id); });
    shop.$on('purchase', (item: ShopItem) => { console.log('purchase:', item.id); });
    shop.$on('close', () => shop.removeFromParent());
    this.addChild(shop);
  }

  private openCheckin() {
    const checkin = new CheckinDialog({
      rewards: [10, 10, 15, 20, 20, 25, 50],
      currentDay: 3,
      claimed: false,
    });
    checkin.$on('claim', (day: number, reward: number) => {
      console.log(`签到第${day + 1}天，奖励${reward}金币`);
      checkin.close();
      checkin.removeFromParent();
    });
    checkin.$on('close', () => checkin.removeFromParent());
    this.addChild(checkin);
  }

  private openSettings() {
    const settings = new SettingsPanel({
      toggles: [
        { id: 'sound', label: '音效', value: true },
        { id: 'music', label: '音乐', value: true },
        { id: 'vibration', label: '振动', value: false },
      ],
      links: [{ id: 'privacy', label: '隐私协议' }],
      version: 'v0.1.0',
    });
    settings.$on('toggle', (id: string, val: boolean) => console.log('toggle:', id, val));
    settings.$on('close', () => settings.removeFromParent());
    this.addChild(settings);
  }

  onBeforeUpdate() {
    this.time += 0.016;
    for (const f of this.floaters) {
      f.x += f.vx * 0.016;
      f.y += f.vy * 0.016;
      if (f.x < 0 || f.x > 390) f.vx *= -1;
      if (f.y < 0 || f.y > 844) f.vy *= -1;
    }
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 844);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 390, 844);

    // Floating particles
    for (const f of this.floaters) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ── 游戏场景（简单弹球 demo）────────────────

class PlayScene extends SceneNode {
  private ballX = 195;
  private ballY = 600;
  private ballVx = 120;
  private ballVy = -200;
  private score = 0;
  private scoreLabel!: Label;
  private blocks: Array<{ x: number; y: number; w: number; h: number; color: string; hp: number }> = [];

  onEnter() {
    // Generate blocks
    const colors = ['#e94560', '#ff6b6b', '#ffa502', '#ffd166', '#06d6a0', '#118ab2'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        this.blocks.push({
          x: 20 + col * 72, y: 100 + row * 36,
          w: 64, h: 28,
          color: colors[row % colors.length],
          hp: 1 + row,
        });
      }
    }

    // HUD
    this.scoreLabel = new Label({ id: 'score', text: 'Score: 0', fontSize: 18, fontWeight: 'bold', color: '#ffd166', align: 'center', width: 390, height: 30 });
    this.scoreLabel.x = 0; this.scoreLabel.y = 50;
    this.addChild(this.scoreLabel);

    // Pause button
    const pauseBtn = new Button({ id: 'pause', text: '⏸', variant: 'ghost', width: 40, height: 40 });
    pauseBtn.x = 10; pauseBtn.y = 45;
    pauseBtn.$on('tap', () => this.showPause());
    this.addChild(pauseBtn);
  }

  private showPause() {
    const modal = new Modal({ id: 'pause-modal', title: '暂停', width: 260, height: 240 });
    modal.x = 65; modal.y = 302;

    const resumeBtn = new Button({ text: '继续', variant: 'primary', width: 180, height: 44 });
    resumeBtn.x = 40; resumeBtn.y = 60;
    resumeBtn.$on('tap', () => { modal.close(); modal.removeFromParent(); });
    modal.content.addChild(resumeBtn);

    const menuBtn = new Button({ text: '返回菜单', variant: 'outline', width: 180, height: 44 });
    menuBtn.x = 40; menuBtn.y = 120;
    menuBtn.$on('tap', () => app.router.replace(new MenuScene({ id: 'menu' })));
    modal.content.addChild(menuBtn);

    modal.open();
    this.addChild(modal);
  }

  onBeforeUpdate() {
    const dt = 0.016;

    // Ball physics
    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;

    // Wall bounce
    if (this.ballX < 8 || this.ballX > 382) { this.ballVx *= -1; this.ballX = Math.max(8, Math.min(382, this.ballX)); }
    if (this.ballY < 80) { this.ballVy *= -1; this.ballY = 80; }

    // Block collision
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (this.ballX + 6 > b.x && this.ballX - 6 < b.x + b.w &&
          this.ballY + 6 > b.y && this.ballY - 6 < b.y + b.h) {
        b.hp--;
        this.ballVy *= -1;
        this.score += 10;
        this.scoreLabel.text = `Score: ${this.score}`;

        // Emit particles
        particles.emit(this.ballX, this.ballY, { count: 8, speed: 100, color: b.color, lifetime: 0.4 });

        if (b.hp <= 0) {
          this.blocks.splice(i, 1);
          this.score += 50;
          particles.emit(b.x + b.w / 2, b.y + b.h / 2, { count: 15, speed: 150, color: b.color, lifetime: 0.6, gravity: 200 });
        }
        break;
      }
    }

    // Game over → result
    if (this.ballY > 860) {
      const result = new ResultPanel({
        title: this.blocks.length === 0 ? '胜利！' : '游戏结束',
        score: this.score,
        isNewBest: this.score > 500,
        stats: [
          { icon: 'block', label: '消除方块', value: String(25 - this.blocks.length) },
          { icon: 'lightning', label: '得分', value: String(this.score) },
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
      app.router.replace(new ResultScene(result));
      return;
    }

    // Win
    if (this.blocks.length === 0 && this.ballY < 800) {
      this.ballVy = Math.abs(this.ballVy); // let it fall
    }

    particles.update(dt);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, 844);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 390, 844);

    // Blocks
    for (const b of this.blocks) {
      ctx.globalAlpha = 0.3 + 0.7 * (b.hp / 5);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      // HP text
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
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Particles
    for (const p of particles.particles) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ── 结算场景 ─────────────────────────────────

class ResultScene extends SceneNode {
  constructor(private resultPanel: ResultPanel) {
    super({ id: 'result-scene' });
  }

  onEnter() {
    this.addChild(this.resultPanel);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, 0, 844);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 390, 844);
  }
}

// ── 启动 ─────────────────────────────────────

app.router.push(new MenuScene({ id: 'menu' }));
app.start();

console.log('[Lucid] Demo started. Debug panel on the right.');
console.log('[Lucid] app.root.$inspect():');
console.log(app.root.$inspect());

// ── Debug Panel ──────────────────────────────

(window as any).showInspect = () => {
  const output = document.getElementById('debug-output')!;
  output.textContent = app.root.$inspect();
};

(window as any).showInteractions = () => {
  const output = document.getElementById('debug-output')!;
  const log = app.dumpInteractions();
  output.textContent = log.length === 0
    ? '(无交互记录 — 点击游戏区域产生记录)'
    : JSON.stringify(log, null, 2);
};

(window as any).clearInteractions = () => {
  app.clearInteractions();
  const output = document.getElementById('debug-output')!;
  output.textContent = '(已清空)';
};
