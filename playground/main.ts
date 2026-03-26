/**
 * Lucid Playground — 全模板演示 + 组件展示
 *
 * 7 个场景模板全部使用 createScene()，展示框架推荐用法。
 */

import { createApp, SceneNode } from '../packages/engine/src/index';
import { UINode } from '../packages/core/src/index';
import { Label, Button, ScrollView } from '../packages/ui/src/index';
import { createScene, showTutorial, type ShopItem, type BattlePassReward } from '../packages/game-ui/src/index';
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

const battlePassRewards: BattlePassReward[] = [
  { level: 1, freeReward: { icon: '🪙', label: '50金币' }, freeClaimed: true },
  { level: 2, freeReward: { icon: '🪙', label: '80金币' }, paidReward: { icon: '⚪', label: '默认皮肤' }, freeClaimed: true, paidClaimed: false },
  { level: 3, freeReward: { icon: '🪙', label: '100金币' }, paidReward: { icon: '🌈', label: '彩虹球' } },
  { level: 4, paidReward: { icon: '🔥', label: '火焰球' } },
  { level: 5, freeReward: { icon: '🪙', label: '200金币' }, paidReward: { icon: '❄️', label: '冰霜球' } },
];

const particles = new ParticlePool(200);
let gameScore = 0;

// ── 工具：绘制渐变背景 ─────────────────────────

function drawBg(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ═══════════════════════════════════════════
// 7 个场景模板
// ═══════════════════════════════════════════

// ── 1. MenuTemplate ──────────────────────────

function createMenuScene() {
  let soundOn = true;
  let vibrationOn = false;

  const scene = createScene(app, {
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

    play: () => app.router.replace(createGameplayScene()),
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
      { id: 'battlepass', onTap: () => app.router.push(createPassScene()) },
    ],

    checkin: { rewards: [10, 15, 20, 25, 30, 40, 80], currentDay: 3, claimed: false, onClaim: () => console.log('[checkin claim]') },

    help: () => {
      showTutorial(scene, {
        steps: [
          { targetId: 'play', text: '点击开始游戏，进入弹球玩法' },
          { targetId: 'shop', text: '在商店购买皮肤和特效' },
          { targetId: 'settings', text: '设置音效、音乐和振动' },
        ],
      });
    },

    version: 'v0.5.1',
    drawBackground: (ctx) => drawBg(ctx),
  });

  return scene;
}

// ── 2. GameplayTemplate ─────────────────────

function createGameplayScene() {
  let score = 0;
  let ballX = W / 2, ballY = 600, ballVx = 130, ballVy = -220;
  const blocks: Array<{ x: number; y: number; w: number; h: number; color: string; hp: number }> = [];
  const colors = ['#e94560', '#ff6b6b', '#ffa502', '#ffd166', '#06d6a0', '#118ab2'];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      blocks.push({ x: 15 + col * 74, y: 100 + row * 36, w: 66, h: 28, color: colors[row], hp: 1 + row });
    }
  }

  return createScene(app, {
    template: 'gameplay',

    hud: {
      score: () => score,
      blocks: () => `${blocks.length}`,
    },

    pause: {
      restart: () => app.router.replace(createGameplayScene()),
      home: () => app.router.replace(createMenuScene()),
      settings: {
        toggles: [
          { id: 'sound', label: '音效', value: true },
          { id: 'music', label: '音乐', value: true },
        ],
        onToggle: (id, val) => console.log('[toggle]', id, val),
      },
    },

    setup: (gameArea) => {
      // Game loop via $update
      const origUpdate = gameArea['$update']?.bind(gameArea);
      gameArea['$update'] = function (dt: number) {
        origUpdate?.(dt);
        const step = 0.016;
        ballX += ballVx * step;
        ballY += ballVy * step;

        if (ballX < 8 || ballX > W - 8) { ballVx *= -1; ballX = Math.max(8, Math.min(W - 8, ballX)); }
        if (ballY < 80) { ballVy = Math.abs(ballVy); }

        for (let i = blocks.length - 1; i >= 0; i--) {
          const b = blocks[i];
          if (ballX + 6 > b.x && ballX - 6 < b.x + b.w && ballY + 6 > b.y && ballY - 6 < b.y + b.h) {
            b.hp--;
            ballVy *= -1;
            score += 10;
            particles.emit(ballX, ballY, { count: 6, speed: 80, color: b.color, lifetime: 0.3 });
            if (b.hp <= 0) {
              blocks.splice(i, 1);
              score += 50;
              particles.emit(b.x + b.w / 2, b.y + b.h / 2, { count: 12, speed: 120, color: b.color, lifetime: 0.5, gravity: 200 });
            }
            break;
          }
        }

        if (ballY > H + 10) {
          gameScore = score;
          app.router.replace(createResultScene(score, 25 - blocks.length));
        }

        particles.update(step);
      };

      // Custom draw for game objects
      const origDraw = gameArea['draw']?.bind(gameArea);
      gameArea['draw'] = function (ctx: CanvasRenderingContext2D) {
        origDraw?.(ctx);
        // Blocks
        for (const b of blocks) {
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
        ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

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
      };
    },

    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 3. ResultTemplate ───────────────────────

function createResultScene(score: number, blocksCleared: number) {
  return createScene(app, {
    template: 'result',
    title: blocksCleared >= 25 ? '全部消除！' : '游戏结束',
    score,
    isNewBest: score > 300,
    stats: [
      { icon: 'block', label: '消除方块', value: String(blocksCleared) },
      { icon: 'star', label: '得分', value: String(score) },
    ],

    restart: () => app.router.replace(createGameplayScene()),
    home: () => app.router.replace(createMenuScene()),
    share: () => console.log('[share]'),

    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 4. ShopTemplate ─────────────────────────

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

// ── 5. ListTemplate (Leaderboard) ───────────

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

// ── 6. PassTemplate (Battle Pass) ───────────

function createPassScene() {
  return createScene(app, {
    template: 'pass',
    back: () => app.router.pop(),
    currentLevel: 3,
    currentXP: 230,
    xpToNext: 500,
    isPremium: false,
    rewards: battlePassRewards,
    seasonName: '赛季 1 · 星际征途',
    onClaim: (level, type) => console.log('[claim]', level, type),
    onBuyPremium: () => console.log('[buy premium]'),
    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ── 7. MapTemplate ──────────────────────────

function createMapScene() {
  return createScene(app, {
    template: 'map',
    title: '星座图',
    back: () => app.router.pop(),
    setup: (mapArea) => {
      // Draw a simple level map with nodes and connections
      const origDraw = mapArea['draw']?.bind(mapArea);
      mapArea['draw'] = function (ctx: CanvasRenderingContext2D) {
        origDraw?.(ctx);
        const levels = [
          { x: 195, y: 600, label: '1', done: true },
          { x: 120, y: 500, label: '2', done: true },
          { x: 270, y: 420, label: '3', done: true },
          { x: 160, y: 320, label: '4', done: false, current: true },
          { x: 230, y: 220, label: '5', done: false },
          { x: 195, y: 120, label: 'Boss', done: false },
        ];

        // Connections
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < levels.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(levels[i].x, levels[i].y);
          ctx.lineTo(levels[i + 1].x, levels[i + 1].y);
          ctx.stroke();
        }

        // Nodes
        for (const lv of levels) {
          const r = lv.label === 'Boss' ? 24 : 18;
          ctx.beginPath();
          ctx.arc(lv.x, lv.y, r, 0, Math.PI * 2);
          ctx.fillStyle = lv.done ? '#06d6a0' : (lv as any).current ? '#ffd166' : '#333';
          ctx.fill();
          if ((lv as any).current) {
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${lv.label === 'Boss' ? 11 : 14}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lv.label, lv.x, lv.y);
        }
      };
    },
    drawBackground: (ctx) => drawBg(ctx),
  });
}

// ═══════════════════════════════════════════
// 场景切换
// ═══════════════════════════════════════════

import { GalleryScene } from './gallery';

// Direct scene launchers (for sidebar buttons)
const sceneLaunchers: Record<string, () => void> = {
  menu: () => app.router.replace(createMenuScene()),
  gameplay: () => app.router.replace(createGameplayScene()),
  result: () => app.router.replace(createResultScene(2480, 18)),
  shop: () => app.router.replace(createShopScene()),
  list: () => app.router.replace(createLeaderboardScene()),
  pass: () => app.router.replace(createPassScene()),
  map: () => app.router.replace(createMapScene()),
  gallery: () => app.router.replace(new GalleryScene({ id: 'gallery' })),
};

(window as any).switchScene = (mode: string) => {
  const launcher = sceneLaunchers[mode];
  if (launcher) launcher();

  document.querySelectorAll('.scene-switcher button').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-scene') === mode);
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
