/**
 * 统一 Icon 系统 — 全量代码绘制，多风格支持
 *
 * 所有图标使用 Canvas 2D path 绘制，解决 Android emoji 白块问题。
 * 支持 4 种风格：filled / outlined / glow / duotone
 * 风格通过 setIconStyle() 全局切换，也可通过 drawIcon 第 7 参数单次指定。
 *
 * 统一签名：drawIcon(ctx, name, cx, cy, size, color, style?)
 *
 * 设计参考：
 *   - Lucide Icons (stroke-based, 24×24, strokeWidth 2)
 *     https://github.com/lucide-icons/lucide
 *     https://lucide.dev/guide/design/icon-design-guide
 *   - Heroicons (Tailwind, outline/solid 双版本)
 *     https://github.com/tailwindlabs/heroicons
 *   - Phosphor Icons (6 种 weight: thin/light/regular/bold/fill/duotone)
 *     https://github.com/phosphor-icons/core
 *
 * 当某个图标效果不理想时，可到上述仓库搜索同名图标的 SVG path 作为参考。
 */

/** 可用图标名称 */
export type IconName =
  // 导航
  | 'pause' | 'play' | 'home' | 'back' | 'close' | 'settings'
  // 操作
  | 'share' | 'retry' | 'gift' | 'lock' | 'unlock' | 'check' | 'plus'
  // 信息
  | 'trophy' | 'crown' | 'star' | 'coin' | 'diamond' | 'heart'
  | 'shield' | 'lightning' | 'clock' | 'block' | 'fire' | 'medal'
  // 功能
  | 'sound-on' | 'sound-off' | 'vibrate' | 'ad-video' | 'checkin'
  | 'mission' | 'achievement' | 'battle-pass';

/** 图标风格 */
export type IconStyle = 'filled' | 'outlined' | 'glow' | 'duotone';

export const ALL_ICON_STYLES: IconStyle[] = ['filled', 'outlined', 'glow', 'duotone'];

/** 全局默认风格 */
let _globalStyle: IconStyle = 'filled';

/** 设置全局图标风格 */
export function setIconStyle(style: IconStyle): void { _globalStyle = style; }

/** 获取当前全局图标风格 */
export function getIconStyle(): IconStyle { return _globalStyle; }

// 离屏 canvas 缓存（用于 outlined 风格的合成）
let _offCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
let _offCtx: CanvasRenderingContext2D | null = null;

function getOffscreen(w: number, h: number): CanvasRenderingContext2D {
  const needed = Math.ceil(w) * Math.ceil(h);
  if (_offCtx && _offCanvas) {
    const cur = _offCanvas.width * _offCanvas.height;
    if (cur >= needed) {
      _offCtx.clearRect(0, 0, _offCanvas.width, _offCanvas.height);
      return _offCtx;
    }
  }
  // 创建离屏（小游戏环境无 OffscreenCanvas，用 createElement）
  try {
    _offCanvas = new OffscreenCanvas(Math.ceil(w), Math.ceil(h)) as unknown as HTMLCanvasElement;
  } catch {
    _offCanvas = document.createElement('canvas');
    _offCanvas.width = Math.ceil(w);
    _offCanvas.height = Math.ceil(h);
  }
  _offCtx = (_offCanvas as HTMLCanvasElement).getContext('2d')!;
  return _offCtx;
}

/** 绘制图标 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  cx: number, cy: number,
  size: number,
  color: string,
  style?: IconStyle,
): void {
  const fn = ICON_REGISTRY[name];
  if (!fn) return;
  const s = style ?? _globalStyle;

  if (s === 'outlined') {
    const outFn = OUTLINED_REGISTRY[name] ?? fn;
    drawOutlined(ctx, outFn, cx, cy, size, color);
  } else if (s === 'glow') {
    drawGlow(ctx, fn, cx, cy, size, color);
  } else if (s === 'duotone') {
    drawDuotone(ctx, fn, cx, cy, size, color);
  } else {
    drawFilled(ctx, fn, cx, cy, size, color);
  }
}

// ── 风格渲染器 ──────────────────────────────────────────────

function drawFilled(ctx: CanvasRenderingContext2D, fn: IconFn, cx: number, cy: number, s: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  fn(ctx, cx, cy, s, color);
  ctx.restore();
}

function drawOutlined(ctx: CanvasRenderingContext2D, _fn: IconFn, cx: number, cy: number, s: number, color: string): void {
  // outlined 使用独立的 stroke 路径注册表
  // 如果没有专用 outlined 版本，回退到 filled
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  _fn(ctx, cx, cy, s, color);
  ctx.restore();
}

function drawGlow(ctx: CanvasRenderingContext2D, fn: IconFn, cx: number, cy: number, s: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // 外发光（iOS 小游戏 shadowBlur 渲染异常，用多层描边替代）
  const isMinigame = typeof (globalThis as any).wx !== 'undefined' || typeof (globalThis as any).tt !== 'undefined';
  if (!isMinigame) {
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.35;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  fn(ctx, cx, cy, s, color);
  ctx.restore();
}

function drawDuotone(ctx: CanvasRenderingContext2D, fn: IconFn, cx: number, cy: number, s: number, color: string): void {
  // 底层：60% alpha 整体形状
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  fn(ctx, cx, cy, s, color);
  ctx.restore();

  // 上层：用渐变遮罩叠加高光（从上到中间淡出），模拟光泽
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const grad = ctx.createLinearGradient(cx, cy - s * 0.5, cx, cy + s * 0.3);
  grad.addColorStop(0, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.restore();

  // 重绘一次确保形状边缘锐利
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.35;
  fn(ctx, cx, cy, s, color);
  ctx.restore();
}

type IconFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) => void;
const ICON_REGISTRY: Record<string, IconFn> = {};
function reg(name: IconName, fn: IconFn): void { ICON_REGISTRY[name] = fn; }

// ── 导航类 ──────────────────────────────────────────────────

reg('pause', (ctx, cx, cy, s) => {
  const barW = s * 0.18;
  const gap = s * 0.12;
  const h = s * 0.38;
  // 两条填充竖条
  roundRect(ctx, cx - gap - barW, cy - h, barW, h * 2, barW * 0.3);
  ctx.fill();
  roundRect(ctx, cx + gap, cy - h, barW, h * 2, barW * 0.3);
  ctx.fill();
});

reg('play', (ctx, cx, cy, s) => {
  // 实心三角
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.22, cy - s * 0.36);
  ctx.lineTo(cx + s * 0.38, cy);
  ctx.lineTo(cx - s * 0.22, cy + s * 0.36);
  ctx.closePath();
  ctx.fill();
});

reg('home', (ctx, cx, cy, s) => {
  // 实心屋顶
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.44);
  ctx.lineTo(cx + s * 0.44, cy - s * 0.02);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.02);
  ctx.lineTo(cx + s * 0.32, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.32, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.32, cy - s * 0.02);
  ctx.lineTo(cx - s * 0.44, cy - s * 0.02);
  ctx.closePath();
  ctx.fill();
});

reg('back', (ctx, cx, cy, s) => {
  // 粗箭头
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.2, cy - s * 0.32);
  ctx.lineTo(cx - s * 0.18, cy);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.32);
  ctx.stroke();
});

reg('close', (ctx, cx, cy, s) => {
  ctx.lineWidth = s * 0.12;
  const d = s * 0.28;
  ctx.beginPath();
  ctx.moveTo(cx - d, cy - d);
  ctx.lineTo(cx + d, cy + d);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + d, cy - d);
  ctx.lineTo(cx - d, cy + d);
  ctx.stroke();
});

reg('settings', (ctx, cx, cy, s) => {
  // 齿轮：实心
  const teeth = 8;
  const outer = s * 0.44;
  const mid = s * 0.34;
  const inner = s * 0.18;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (Math.PI * 2 * i) / teeth - Math.PI / 2;
    const a2 = a1 + Math.PI / teeth * 0.4;
    const a3 = a1 + Math.PI / teeth * 0.6;
    const a4 = a1 + Math.PI / teeth;
    if (i === 0) ctx.moveTo(cx + Math.cos(a1) * outer, cy + Math.sin(a1) * outer);
    ctx.lineTo(cx + Math.cos(a2) * outer, cy + Math.sin(a2) * outer);
    ctx.lineTo(cx + Math.cos(a3) * mid, cy + Math.sin(a3) * mid);
    ctx.lineTo(cx + Math.cos(a4) * mid, cy + Math.sin(a4) * mid);
  }
  ctx.closePath();
  ctx.fill();
  // 中心挖空圆（用背景色覆盖）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

// ── 操作类 ──────────────────────────────────────────────────

reg('share', (ctx, cx, cy, s) => {
  ctx.lineWidth = s * 0.1;
  // 向上箭头
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.42);
  ctx.lineTo(cx, cy + s * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.24, cy - s * 0.18);
  ctx.lineTo(cx, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.24, cy - s * 0.18);
  ctx.stroke();
  // 底部托盘
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.08);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.42);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.42);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.08);
  ctx.stroke();
});

reg('retry', (ctx, cx, cy, s) => {
  // 参考 Lucide rotate-cw：270°弧 + 右上角 L 形箭头
  const r = s * 0.36;
  ctx.lineWidth = s * 0.09;
  // 270° 弧：从 3 点钟顺时针到 12 点钟
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, -Math.PI / 2);
  ctx.stroke();
  // 从 12 点钟位置向右上弧出到箭头尖端
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(
    cx + r * 0.28, cy - r,
    cx + r * 0.55, cy - r * 0.89,
    cx + r * 0.75, cy - r * 0.70,
  );
  ctx.lineTo(cx + r, cy - r * 0.44);
  ctx.stroke();
  // L 形箭头（右上角）
  ctx.beginPath();
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx + r, cy - r * 0.44);
  ctx.lineTo(cx + r * 0.44, cy - r * 0.44);
  ctx.stroke();
});

reg('gift', (ctx, cx, cy, s) => {
  // 盒子（实心）
  const bw = s * 0.7;
  const bh = s * 0.45;
  const top = cy + s * 0.0;
  roundRect(ctx, cx - bw / 2, top, bw, bh, s * 0.06);
  ctx.fill();
  // 盖子
  roundRect(ctx, cx - bw / 2 - s * 0.04, top - s * 0.16, bw + s * 0.08, s * 0.18, s * 0.04);
  ctx.fill();
  // 丝带（深色线条切割）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(cx - s * 0.04, top - s * 0.16, s * 0.08, bh + s * 0.16);
  ctx.fillRect(cx - bw / 2 - s * 0.04, top + s * 0.06, bw + s * 0.08, s * 0.06);
  ctx.restore();
  // 蝴蝶结
  ctx.beginPath();
  ctx.arc(cx - s * 0.14, top - s * 0.22, s * 0.1, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.14, top - s * 0.22, s * 0.1, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();
});

reg('lock', (ctx, cx, cy, s) => {
  // 锁体（实心）
  const bw = s * 0.52;
  const bh = s * 0.4;
  const by = cy + s * 0.04;
  roundRect(ctx, cx - bw / 2, by, bw, bh, s * 0.08);
  ctx.fill();
  // 锁环
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.arc(cx, by, s * 0.2, Math.PI, 0);
  ctx.stroke();
  // 锁孔（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, by + bh * 0.35, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - s * 0.025, by + bh * 0.35, s * 0.05, bh * 0.32);
  ctx.restore();
});

reg('unlock', (ctx, cx, cy, s) => {
  const bw = s * 0.52;
  const bh = s * 0.4;
  const by = cy + s * 0.04;
  roundRect(ctx, cx - bw / 2, by, bw, bh, s * 0.08);
  ctx.fill();
  // 开着的锁环
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.arc(cx, by, s * 0.2, Math.PI * 1.15, Math.PI * 0.0);
  ctx.stroke();
  // 锁孔
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, by + bh * 0.35, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

reg('check', (ctx, cx, cy, s) => {
  ctx.lineWidth = s * 0.14;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.26);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.22);
  ctx.stroke();
});

reg('plus', (ctx, cx, cy, s) => {
  const w = s * 0.14;
  const h = s * 0.36;
  // 横
  roundRect(ctx, cx - h, cy - w / 2, h * 2, w, w * 0.3);
  ctx.fill();
  // 竖
  roundRect(ctx, cx - w / 2, cy - h, w, h * 2, w * 0.3);
  ctx.fill();
});

// ── 信息类 ──────────────────────────────────────────────────

reg('trophy', (ctx, cx, cy, s) => {
  // 杯身（实心弧）
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, cy - s * 0.28);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.28);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.08);
  ctx.arc(cx, cy - s * 0.08, s * 0.32, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  // 把手
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(cx - s * 0.34, cy - s * 0.1, s * 0.12, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.34, cy - s * 0.1, s * 0.12, Math.PI * 1.5, Math.PI * 0.5, false);
  ctx.stroke();
  // 茎+底座
  roundRect(ctx, cx - s * 0.04, cy + s * 0.22, s * 0.08, s * 0.16, 0);
  ctx.fill();
  roundRect(ctx, cx - s * 0.22, cy + s * 0.38, s * 0.44, s * 0.06, s * 0.03);
  ctx.fill();
});

reg('crown', (ctx, cx, cy, s) => {
  // 实心皇冠
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.4, cy + s * 0.28);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.15);
  ctx.lineTo(cx - s * 0.16, cy + s * 0.08);
  ctx.lineTo(cx, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.16, cy + s * 0.08);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.15);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.28);
  ctx.closePath();
  ctx.fill();
  // 三个顶部宝石圆点
  const gems = [cx - s * 0.38, cx, cx + s * 0.38];
  const gemY = [cy - s * 0.15, cy - s * 0.38, cy - s * 0.15];
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(gems[i], gemY[i], s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
});

reg('star', (ctx, cx, cy, s) => {
  // 实心五角星
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * s * 0.44, cy + Math.sin(oa) * s * 0.44);
    ctx.lineTo(cx + Math.cos(ia) * s * 0.18, cy + Math.sin(ia) * s * 0.18);
  }
  ctx.closePath();
  ctx.fill();
});

reg('coin', (ctx, cx, cy, s) => {
  const r = s * 0.44;
  // 实心圆
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // 内部 ¥ 符号（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = `bold ${s * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥', cx, cy);
  ctx.restore();
});

reg('diamond', (ctx, cx, cy, s) => {
  // 实心菱形
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.44);
  ctx.lineTo(cx + s * 0.22, cy - s * 0.12);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.12);
  ctx.lineTo(cx, cy + s * 0.44);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.12);
  ctx.lineTo(cx - s * 0.22, cy - s * 0.12);
  ctx.closePath();
  ctx.fill();
  // 横线刻面
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(cx - s * 0.38, cy - s * 0.14, s * 0.76, s * 0.04);
  ctx.restore();
});

reg('heart', (ctx, cx, cy, s) => {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.38);
  ctx.bezierCurveTo(cx - s * 0.55, cy + s * 0.05, cx - s * 0.55, cy - s * 0.35, cx, cy - s * 0.15);
  ctx.bezierCurveTo(cx + s * 0.55, cy - s * 0.35, cx + s * 0.55, cy + s * 0.05, cx, cy + s * 0.38);
  ctx.fill();
});

reg('shield', (ctx, cx, cy, s) => {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.46);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.32);
  ctx.lineTo(cx + s * 0.38, cy + s * 0.05);
  ctx.quadraticCurveTo(cx + s * 0.36, cy + s * 0.36, cx, cy + s * 0.48);
  ctx.quadraticCurveTo(cx - s * 0.36, cy + s * 0.36, cx - s * 0.38, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.32);
  ctx.closePath();
  ctx.fill();
});

reg('lightning', (ctx, cx, cy, s) => {
  // 实心闪电
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.06, cy - s * 0.46);
  ctx.lineTo(cx - s * 0.28, cy + s * 0.02);
  ctx.lineTo(cx - s * 0.02, cy + s * 0.02);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.46);
  ctx.lineTo(cx + s * 0.28, cy - s * 0.02);
  ctx.lineTo(cx + s * 0.02, cy - s * 0.02);
  ctx.closePath();
  ctx.fill();
});

reg('clock', (ctx, cx, cy, s) => {
  // 外圆
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.44, 0, Math.PI * 2);
  ctx.fill();
  // 内圆挖空
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 指针（实心）
  roundRect(ctx, cx - s * 0.03, cy - s * 0.26, s * 0.06, s * 0.28, s * 0.02);
  ctx.fill();
  roundRect(ctx, cx - s * 0.03, cy - s * 0.03, s * 0.22, s * 0.06, s * 0.02);
  ctx.fill();
});

reg('block', (ctx, cx, cy, s) => {
  const hw = s * 0.36;
  roundRect(ctx, cx - hw, cy - hw, hw * 2, hw * 2, s * 0.1);
  ctx.fill();
  // 高光条纹
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(cx - hw + s * 0.08, cy - hw + s * 0.08, hw * 2 - s * 0.16, s * 0.06);
  ctx.restore();
});

reg('fire', (ctx, cx, cy, s) => {
  // 外焰
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.44);
  ctx.bezierCurveTo(cx - s * 0.42, cy + s * 0.08, cx - s * 0.36, cy - s * 0.22, cx, cy - s * 0.46);
  ctx.bezierCurveTo(cx + s * 0.36, cy - s * 0.22, cx + s * 0.42, cy + s * 0.08, cx, cy + s * 0.44);
  ctx.fill();
  // 内焰（挖空 lighter）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.32);
  ctx.bezierCurveTo(cx - s * 0.18, cy + s * 0.1, cx - s * 0.14, cy - s * 0.04, cx, cy - s * 0.16);
  ctx.bezierCurveTo(cx + s * 0.14, cy - s * 0.04, cx + s * 0.18, cy + s * 0.1, cx, cy + s * 0.32);
  ctx.fill();
  ctx.restore();
});

// ── 功能类 ──────────────────────────────────────────────────

reg('sound-on', (ctx, cx, cy, s) => {
  // 喇叭体（实心）
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.32, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.32, cy + s * 0.14);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.14);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.32);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.32);
  ctx.closePath();
  ctx.fill();
  // 声波弧
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(cx + s * 0.14, cy, s * 0.16, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.14, cy, s * 0.28, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();
});

reg('sound-off', (ctx, cx, cy, s) => {
  // 喇叭体
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.32, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.32, cy + s * 0.14);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.14);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.32);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.32);
  ctx.closePath();
  ctx.fill();
  // 叉号
  ctx.lineWidth = s * 0.09;
  const ox = cx + s * 0.3;
  ctx.beginPath();
  ctx.moveTo(ox - s * 0.1, cy - s * 0.14);
  ctx.lineTo(ox + s * 0.1, cy + s * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + s * 0.1, cy - s * 0.14);
  ctx.lineTo(ox - s * 0.1, cy + s * 0.14);
  ctx.stroke();
});

reg('vibrate', (ctx, cx, cy, s) => {
  // 手机（实心）
  const pw = s * 0.28;
  const ph = s * 0.42;
  roundRect(ctx, cx - pw / 2, cy - ph, pw, ph * 2, s * 0.06);
  ctx.fill();
  // 屏幕挖空
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  roundRect(ctx, cx - pw / 2 + s * 0.04, cy - ph + s * 0.1, pw - s * 0.08, ph * 2 - s * 0.22, s * 0.02);
  ctx.fill();
  ctx.restore();
  // 振动线
  ctx.lineWidth = s * 0.06;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * (pw / 2 + s * 0.1), cy - s * 0.18);
    ctx.lineTo(cx + dir * (pw / 2 + s * 0.1), cy + s * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dir * (pw / 2 + s * 0.2), cy - s * 0.1);
    ctx.lineTo(cx + dir * (pw / 2 + s * 0.2), cy + s * 0.1);
    ctx.stroke();
  }
});

reg('ad-video', (ctx, cx, cy, s) => {
  // 屏幕（实心）
  roundRect(ctx, cx - s * 0.38, cy - s * 0.28, s * 0.76, s * 0.48, s * 0.06);
  ctx.fill();
  // 播放三角（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.16);
  ctx.lineTo(cx + s * 0.18, cy - s * 0.04);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 底座
  roundRect(ctx, cx - s * 0.04, cy + s * 0.2, s * 0.08, s * 0.1, 0);
  ctx.fill();
  roundRect(ctx, cx - s * 0.16, cy + s * 0.3, s * 0.32, s * 0.05, s * 0.02);
  ctx.fill();
});

reg('checkin', (ctx, cx, cy, s) => {
  // 日历（实心）
  const w = s * 0.7;
  const h = s * 0.62;
  const top = cy - h / 2 + s * 0.08;
  roundRect(ctx, cx - w / 2, top, w, h, s * 0.08);
  ctx.fill();
  // 顶部色条（挖空区分）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(cx - w / 2 + s * 0.04, top + s * 0.15, w - s * 0.08, h - s * 0.19);
  ctx.restore();
  // 挂钩
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.14, top - s * 0.06);
  ctx.lineTo(cx - s * 0.14, top + s * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.14, top - s * 0.06);
  ctx.lineTo(cx + s * 0.14, top + s * 0.08);
  ctx.stroke();
  // 勾
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.14, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.02, cy + s * 0.24);
  ctx.lineTo(cx + s * 0.18, cy + s * 0.02);
  ctx.stroke();
});

reg('mission', (ctx, cx, cy, s) => {
  // 剪贴板（实心）
  const w = s * 0.58;
  const h = s * 0.76;
  const top = cy - h / 2;
  roundRect(ctx, cx - w / 2, top, w, h, s * 0.06);
  ctx.fill();
  // 顶部夹子
  roundRect(ctx, cx - s * 0.14, top - s * 0.04, s * 0.28, s * 0.12, s * 0.03);
  ctx.fill();
  // 横线（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const ly = top + s * 0.22 + i * s * 0.18;
    roundRect(ctx, cx - w / 2 + s * 0.1, ly, w - s * 0.2, s * 0.05, s * 0.02);
    ctx.fill();
  }
  ctx.restore();
});

reg('achievement', (ctx, cx, cy, s) => {
  // 奖牌圆（实心）
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.06, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // 中心星（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  const sr = s * 0.14;
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * sr, cy - s * 0.06 + Math.sin(oa) * sr);
    ctx.lineTo(cx + Math.cos(ia) * sr * 0.45, cy - s * 0.06 + Math.sin(ia) * sr * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 绶带（实心三角）
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy + s * 0.16);
  ctx.lineTo(cx - s * 0.28, cy + s * 0.46);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.2, cy + s * 0.16);
  ctx.lineTo(cx + s * 0.28, cy + s * 0.46);
  ctx.lineTo(cx + s * 0.06, cy + s * 0.32);
  ctx.closePath();
  ctx.fill();
});

reg('battle-pass', (ctx, cx, cy, s) => {
  // 盾牌（实心）
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.46);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.26);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.06);
  ctx.quadraticCurveTo(cx + s * 0.38, cy + s * 0.34, cx, cy + s * 0.48);
  ctx.quadraticCurveTo(cx - s * 0.38, cy + s * 0.34, cx - s * 0.4, cy + s * 0.06);
  ctx.lineTo(cx - s * 0.4, cy - s * 0.26);
  ctx.closePath();
  ctx.fill();
  // 中央星（挖空）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  const bsr = s * 0.18;
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * bsr, cy + Math.sin(oa) * bsr);
    ctx.lineTo(cx + Math.cos(ia) * bsr * 0.45, cy + Math.sin(ia) * bsr * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
});

// ── 辅助：圆角矩形路径 ──────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Outlined 图标注册表（stroke 路径，独立实现） ─────────────

const OUTLINED_REGISTRY: Record<string, IconFn> = {};
function regO(name: IconName, fn: IconFn): void { OUTLINED_REGISTRY[name] = fn; }

// 辅助：统一 stroke 设置
function setupStroke(ctx: CanvasRenderingContext2D, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

regO('pause', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const bw = s * 0.14; const gap = s * 0.14; const h = s * 0.36;
  roundRect(ctx, cx - gap - bw, cy - h, bw, h * 2, 2); ctx.stroke();
  roundRect(ctx, cx + gap, cy - h, bw, h * 2, 2); ctx.stroke();
});

regO('play', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.22, cy - s * 0.34);
  ctx.lineTo(cx + s * 0.34, cy);
  ctx.lineTo(cx - s * 0.22, cy + s * 0.34);
  ctx.closePath();
  ctx.stroke();
});

regO('home', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  // 屋顶
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.44, cy - s * 0.02);
  ctx.lineTo(cx, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.44, cy - s * 0.02);
  ctx.stroke();
  // 房身
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, cy - s * 0.08);
  ctx.lineTo(cx - s * 0.32, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.32, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.08);
  ctx.stroke();
  // 门
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.12);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.12);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.38);
  ctx.stroke();
});

regO('back', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.2, cy - s * 0.32);
  ctx.lineTo(cx - s * 0.18, cy);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.32);
  ctx.stroke();
});

regO('close', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.lineWidth = s * 0.1;
  const d = s * 0.28;
  ctx.beginPath(); ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d); ctx.stroke();
});

regO('settings', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  // 外齿轮
  const teeth = 8; const outer = s * 0.42; const mid = s * 0.32;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (Math.PI * 2 * i) / teeth - Math.PI / 2;
    const a2 = a1 + Math.PI / teeth * 0.4;
    const a3 = a1 + Math.PI / teeth * 0.6;
    const a4 = a1 + Math.PI / teeth;
    if (i === 0) ctx.moveTo(cx + Math.cos(a1) * outer, cy + Math.sin(a1) * outer);
    ctx.lineTo(cx + Math.cos(a2) * outer, cy + Math.sin(a2) * outer);
    ctx.lineTo(cx + Math.cos(a3) * mid, cy + Math.sin(a3) * mid);
    ctx.lineTo(cx + Math.cos(a4) * mid, cy + Math.sin(a4) * mid);
  }
  ctx.closePath(); ctx.stroke();
  // 中心圆
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.15, 0, Math.PI * 2); ctx.stroke();
});

regO('share', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.42); ctx.lineTo(cx, cy + s * 0.08); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.24, cy - s * 0.18); ctx.lineTo(cx, cy - s * 0.42); ctx.lineTo(cx + s * 0.24, cy - s * 0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.35, cy + s * 0.08); ctx.lineTo(cx - s * 0.35, cy + s * 0.42); ctx.lineTo(cx + s * 0.35, cy + s * 0.42); ctx.lineTo(cx + s * 0.35, cy + s * 0.08); ctx.stroke();
});

regO('retry', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const r = s * 0.36;
  // 270° 弧
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, -Math.PI / 2); ctx.stroke();
  // 弧出到箭头
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.28, cy - r, cx + r * 0.55, cy - r * 0.89, cx + r * 0.75, cy - r * 0.70);
  ctx.lineTo(cx + r, cy - r * 0.44);
  ctx.stroke();
  // L 形箭头
  ctx.beginPath();
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx + r, cy - r * 0.44);
  ctx.lineTo(cx + r * 0.44, cy - r * 0.44);
  ctx.stroke();
});

regO('gift', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const bw = s * 0.7; const bh = s * 0.45; const top = cy;
  roundRect(ctx, cx - bw / 2, top, bw, bh, s * 0.06); ctx.stroke();
  roundRect(ctx, cx - bw / 2 - s * 0.04, top - s * 0.16, bw + s * 0.08, s * 0.18, s * 0.04); ctx.stroke();
  // 丝带十字
  ctx.beginPath(); ctx.moveTo(cx, top - s * 0.16); ctx.lineTo(cx, top + bh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - bw / 2, top + s * 0.08); ctx.lineTo(cx + bw / 2, top + s * 0.08); ctx.stroke();
  // 蝴蝶结
  ctx.beginPath(); ctx.arc(cx - s * 0.13, top - s * 0.22, s * 0.09, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + s * 0.13, top - s * 0.22, s * 0.09, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
});

regO('lock', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const bw = s * 0.5; const bh = s * 0.38; const by = cy + s * 0.04;
  roundRect(ctx, cx - bw / 2, by, bw, bh, s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, by, s * 0.18, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, by + bh * 0.38, s * 0.05, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, by + bh * 0.45); ctx.lineTo(cx, by + bh * 0.7); ctx.stroke();
});

regO('unlock', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const bw = s * 0.5; const bh = s * 0.38; const by = cy + s * 0.04;
  roundRect(ctx, cx - bw / 2, by, bw, bh, s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, by, s * 0.18, Math.PI * 1.15, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, by + bh * 0.38, s * 0.05, 0, Math.PI * 2); ctx.stroke();
});

regO('check', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color); ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy); ctx.lineTo(cx - s * 0.06, cy + s * 0.26); ctx.lineTo(cx + s * 0.32, cy - s * 0.22); ctx.stroke();
});

regO('plus', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color); ctx.lineWidth = s * 0.1;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.32, cy); ctx.lineTo(cx + s * 0.32, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.32); ctx.lineTo(cx, cy + s * 0.32); ctx.stroke();
});

regO('trophy', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  // 杯身 U
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 0.32, 0, Math.PI); ctx.stroke();
  // 杯口横线
  ctx.beginPath(); ctx.moveTo(cx - s * 0.32, cy - s * 0.1); ctx.lineTo(cx + s * 0.32, cy - s * 0.1); ctx.stroke();
  // 把手
  ctx.beginPath(); ctx.arc(cx - s * 0.34, cy - s * 0.1, s * 0.12, Math.PI * 1.5, Math.PI * 0.5, true); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + s * 0.34, cy - s * 0.1, s * 0.12, Math.PI * 1.5, Math.PI * 0.5, false); ctx.stroke();
  // 茎 + 底座
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.22); ctx.lineTo(cx, cy + s * 0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy + s * 0.42); ctx.lineTo(cx + s * 0.22, cy + s * 0.42); ctx.stroke();
});

regO('crown', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.4, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.18);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.06);
  ctx.lineTo(cx, cy - s * 0.36);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.06);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.18);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.25);
  ctx.closePath(); ctx.stroke();
});

regO('star', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * s * 0.42, cy + Math.sin(oa) * s * 0.42);
    ctx.lineTo(cx + Math.cos(ia) * s * 0.18, cy + Math.sin(ia) * s * 0.18);
  }
  ctx.closePath(); ctx.stroke();
});

regO('coin', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2); ctx.stroke();
  // ¥ 符号
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.2); ctx.lineTo(cx, cy + s * 0.22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy - s * 0.04); ctx.lineTo(cx + s * 0.12, cy - s * 0.04); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy + s * 0.08); ctx.lineTo(cx + s * 0.12, cy + s * 0.08); ctx.stroke();
});

regO('diamond', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.36, cy - s * 0.1);
  ctx.lineTo(cx, cy + s * 0.42);
  ctx.lineTo(cx - s * 0.36, cy - s * 0.1);
  ctx.closePath(); ctx.stroke();
  // 顶部横线
  ctx.beginPath(); ctx.moveTo(cx - s * 0.36, cy - s * 0.1); ctx.lineTo(cx + s * 0.36, cy - s * 0.1); ctx.stroke();
  // 刻面线
  ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy - s * 0.1); ctx.lineTo(cx, cy - s * 0.42); ctx.lineTo(cx + s * 0.18, cy - s * 0.1); ctx.stroke();
});

regO('heart', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.36);
  ctx.bezierCurveTo(cx - s * 0.52, cy + s * 0.05, cx - s * 0.52, cy - s * 0.32, cx, cy - s * 0.12);
  ctx.bezierCurveTo(cx + s * 0.52, cy - s * 0.32, cx + s * 0.52, cy + s * 0.05, cx, cy + s * 0.36);
  ctx.stroke();
});

regO('shield', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.44);
  ctx.lineTo(cx + s * 0.36, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.36, cy + s * 0.05);
  ctx.quadraticCurveTo(cx + s * 0.34, cy + s * 0.34, cx, cy + s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.34, cy + s * 0.34, cx - s * 0.36, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.36, cy - s * 0.3);
  ctx.closePath(); ctx.stroke();
  // 内部勾
  ctx.beginPath(); ctx.moveTo(cx - s * 0.14, cy); ctx.lineTo(cx - s * 0.02, cy + s * 0.14); ctx.lineTo(cx + s * 0.16, cy - s * 0.1); ctx.stroke();
});

regO('lightning', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.08, cy - s * 0.44);
  ctx.lineTo(cx - s * 0.24, cy + s * 0.02);
  ctx.lineTo(cx, cy + s * 0.02);
  ctx.lineTo(cx - s * 0.08, cy + s * 0.44);
  ctx.stroke();
});

regO('clock', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - s * 0.26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.2, cy); ctx.stroke();
  // 圆心点
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.03, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
});

regO('block', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const hw = s * 0.36;
  roundRect(ctx, cx - hw, cy - hw, hw * 2, hw * 2, s * 0.1); ctx.stroke();
  // 内部对角线装饰
  ctx.beginPath(); ctx.moveTo(cx - hw * 0.5, cy - hw * 0.5); ctx.lineTo(cx + hw * 0.5, cy + hw * 0.5); ctx.stroke();
});

regO('fire', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  // 外焰
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(cx - s * 0.4, cy + s * 0.08, cx - s * 0.34, cy - s * 0.2, cx, cy - s * 0.44);
  ctx.bezierCurveTo(cx + s * 0.34, cy - s * 0.2, cx + s * 0.4, cy + s * 0.08, cx, cy + s * 0.42);
  ctx.stroke();
  // 内焰
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.28);
  ctx.bezierCurveTo(cx - s * 0.16, cy + s * 0.08, cx - s * 0.12, cy - s * 0.04, cx, cy - s * 0.14);
  ctx.bezierCurveTo(cx + s * 0.12, cy - s * 0.04, cx + s * 0.16, cy + s * 0.08, cx, cy + s * 0.28);
  ctx.stroke();
});

regO('sound-on', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.14); ctx.lineTo(cx - s * 0.3, cy + s * 0.14);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.14); ctx.lineTo(cx + s * 0.08, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.3); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + s * 0.12, cy, s * 0.16, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + s * 0.12, cy, s * 0.28, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke();
});

regO('sound-off', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.14); ctx.lineTo(cx - s * 0.3, cy + s * 0.14);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.14); ctx.lineTo(cx + s * 0.08, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.3); ctx.closePath(); ctx.stroke();
  const ox = cx + s * 0.28;
  ctx.beginPath(); ctx.moveTo(ox - s * 0.1, cy - s * 0.12); ctx.lineTo(ox + s * 0.1, cy + s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + s * 0.1, cy - s * 0.12); ctx.lineTo(ox - s * 0.1, cy + s * 0.12); ctx.stroke();
});

regO('vibrate', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const pw = s * 0.26; const ph = s * 0.4;
  roundRect(ctx, cx - pw / 2, cy - ph, pw, ph * 2, s * 0.05); ctx.stroke();
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(cx + dir * (pw / 2 + s * 0.1), cy - s * 0.18); ctx.lineTo(cx + dir * (pw / 2 + s * 0.1), cy + s * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + dir * (pw / 2 + s * 0.2), cy - s * 0.1); ctx.lineTo(cx + dir * (pw / 2 + s * 0.2), cy + s * 0.1); ctx.stroke();
  }
});

regO('ad-video', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  roundRect(ctx, cx - s * 0.36, cy - s * 0.26, s * 0.72, s * 0.44, s * 0.05); ctx.stroke();
  // 播放三角
  ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy - s * 0.14); ctx.lineTo(cx + s * 0.16, cy - s * 0.04); ctx.lineTo(cx - s * 0.1, cy + s * 0.06); ctx.closePath(); ctx.stroke();
  // 底座
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.18); ctx.lineTo(cx, cy + s * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.14, cy + s * 0.3); ctx.lineTo(cx + s * 0.14, cy + s * 0.3); ctx.stroke();
});

regO('checkin', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const w = s * 0.66; const h = s * 0.6; const top = cy - h / 2 + s * 0.06;
  roundRect(ctx, cx - w / 2, top, w, h, s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - w / 2, top + s * 0.16); ctx.lineTo(cx + w / 2, top + s * 0.16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.14, top - s * 0.06); ctx.lineTo(cx - s * 0.14, top + s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.14, top - s * 0.06); ctx.lineTo(cx + s * 0.14, top + s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.14, cy + s * 0.08); ctx.lineTo(cx - s * 0.02, cy + s * 0.22); ctx.lineTo(cx + s * 0.16, cy + s * 0.0); ctx.stroke();
});

regO('mission', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  const w = s * 0.56; const h = s * 0.72; const top = cy - h / 2;
  roundRect(ctx, cx - w / 2, top, w, h, s * 0.05); ctx.stroke();
  roundRect(ctx, cx - s * 0.12, top - s * 0.04, s * 0.24, s * 0.1, s * 0.03); ctx.stroke();
  const ll = cx - w / 2 + s * 0.1; const lr = cx + w / 2 - s * 0.1;
  for (let i = 0; i < 3; i++) { const ly = top + s * 0.22 + i * s * 0.18; ctx.beginPath(); ctx.moveTo(ll, ly); ctx.lineTo(lr, ly); ctx.stroke(); }
});

regO('achievement', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.06, s * 0.26, 0, Math.PI * 2); ctx.stroke();
  // 中心星
  ctx.beginPath();
  const sr = s * 0.13;
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * sr, cy - s * 0.06 + Math.sin(oa) * sr);
    ctx.lineTo(cx + Math.cos(ia) * sr * 0.45, cy - s * 0.06 + Math.sin(ia) * sr * 0.45);
  }
  ctx.closePath(); ctx.stroke();
  // 绶带
  ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy + s * 0.18); ctx.lineTo(cx - s * 0.26, cy + s * 0.44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.18, cy + s * 0.18); ctx.lineTo(cx + s * 0.26, cy + s * 0.44); ctx.stroke();
});

regO('battle-pass', (ctx, cx, cy, s, color) => {
  setupStroke(ctx, s, color);
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.44);
  ctx.lineTo(cx + s * 0.38, cy - s * 0.24);
  ctx.lineTo(cx + s * 0.38, cy + s * 0.06);
  ctx.quadraticCurveTo(cx + s * 0.36, cy + s * 0.32, cx, cy + s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.36, cy + s * 0.32, cx - s * 0.38, cy + s * 0.06);
  ctx.lineTo(cx - s * 0.38, cy - s * 0.24);
  ctx.closePath(); ctx.stroke();
  // 中央星
  ctx.beginPath();
  const bsr = s * 0.16;
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * bsr, cy + Math.sin(oa) * bsr);
    ctx.lineTo(cx + Math.cos(ia) * bsr * 0.45, cy + Math.sin(ia) * bsr * 0.45);
  }
  ctx.closePath(); ctx.stroke();
});

// ── 奖牌 ────────────────────────────────────────────────────

reg('medal', (ctx, cx, cy, s) => {
  // 参考 Lucide Icons medal: 圆形奖牌 + 下方缎带
  const r = s * 0.28;
  const ribbonW = s * 0.16;
  const ribbonH = s * 0.22;

  // 缎带（两条 V 形带子）
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy + r * 0.3);
  ctx.lineTo(cx - ribbonW - r * 0.1, cy + r + ribbonH);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.3);
  ctx.lineTo(cx + ribbonW + r * 0.1, cy + r + ribbonH);
  ctx.lineTo(cx + r * 0.1, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();

  // 奖牌圆盘
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.06, r, 0, Math.PI * 2);
  ctx.fill();

  // 内圈（挖空效果）
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.06, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 星形中心
  ctx.beginPath();
  const sr = r * 0.35;
  const scy = cy - s * 0.06;
  for (let i = 0; i < 5; i++) {
    const oa = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(oa) * sr, scy + Math.sin(oa) * sr);
    ctx.lineTo(cx + Math.cos(ia) * sr * 0.45, scy + Math.sin(ia) * sr * 0.45);
  }
  ctx.closePath();
  ctx.fill();
});

// ── 导出 ────────────────────────────────────────────────────

export const ALL_ICON_NAMES: IconName[] = Object.keys(ICON_REGISTRY) as IconName[];
