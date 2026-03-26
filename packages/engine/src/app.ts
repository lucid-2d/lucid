/**
 * createApp — Lucid 应用入口
 *
 * 借鉴 Vue 的 createApp：一行启动整个游戏。
 */

import { UINode, InteractionRecorder, SeededRNG, type InteractionRecord } from '@lucid-2d/core';
import { SceneRouter } from './scene.js';
import { attachDebugPanel, type DebugPanel } from './debug-panel.js';
import { detectPlatform, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
import { WebAdapter } from './platform/web.js';
import { WxAdapter } from './platform/wx.js';
import { TtAdapter } from './platform/tt.js';
import { setAssetRoot } from './image-loader.js';

/** Touch event data passed to touchstart/touchmove/touchend handlers */
export interface LucidTouchEvent {
  /** World X coordinate (alias for worldX) */
  x: number;
  /** World Y coordinate (alias for worldY) */
  y: number;
  /** Local X relative to the hit node */
  localX: number;
  /** Local Y relative to the hit node */
  localY: number;
  /** World X coordinate */
  worldX: number;
  /** World Y coordinate */
  worldY: number;
}

export interface ReplayStep {
  /** 第几步 */
  step: number;
  /** 录制的时间戳(ms) */
  t: number;
  /** 距上一步的间隔(ms)——操作节奏 */
  dt: number;
  /** 事件类型 */
  type: string;
  /** 录制时命中的路径 */
  recordedPath: string;
  /** 回放时实际命中的路径（可能因状态不同而不同） */
  actualPath: string;
  /** 回放时命中节点的快照 */
  snapshot: string;
  /** 路径是否匹配 */
  pathMatch: boolean;
  /** 回放后的场景树快照 */
  treeSnapshot: string;
}

export interface AppOptions {
  /** 手动指定平台，不指定则自动检测 */
  platform?: 'wx' | 'tt' | 'web';
  /** Web 模式下指定 canvas */
  canvas?: HTMLCanvasElement;
  /** 自定义适配器 */
  adapter?: PlatformAdapter;
  /** 调试模式 */
  debug?: boolean;
  /** 显示 debug 叠加层（节点边框、ID、触摸区域） */
  debugOverlay?: boolean;
  /** RNG 种子（不指定则自动生成） */
  rngSeed?: number;
  /** 固定时间步长（秒），启用 $fixedUpdate（例: 0.016 = 62.5Hz） */
  fixedTimestep?: number;
  /** 显示内置调试面板（浮动按钮 → 状态 dump → 复制给 AI） */
  debugPanel?: boolean;
  /**
   * Root path for resolving relative image paths in loadImage().
   * Useful for cross-platform builds where asset paths differ:
   * - Web: '' (Vite dev server handles /img/bg.png)
   * - WX/TT: 'img/' (relative to mini game package root)
   * - Headless: '/absolute/path/to/assets/'
   */
  assetRoot?: string;
}

export interface App {
  readonly root: UINode;
  readonly router: SceneRouter;
  readonly screen: ScreenInfo;
  /** Platform canvas (Web: HTMLCanvasElement, WX/TT: platform canvas object) */
  readonly canvas: any;
  /** 全局可复现随机数生成器 */
  readonly rng: SeededRNG;
  debug: boolean;
  /** 显示 debug 叠加层（节点边框/ID/触摸区域） */
  debugOverlay: boolean;
  /** 全局时间缩放（0=暂停, 0.5=慢放, 1=正常, 2=加速） */
  timeScale: number;
  /** 固定时间步长（秒），0 表示禁用 $fixedUpdate */
  fixedTimestep: number;
  /** 内置调试面板实例（debugPanel: true 时自动创建） */
  readonly debugPanel: DebugPanel | null;
  /** @internal Touch log for DebugPanel (debug mode only) */
  readonly __touchLog?: any[];

  /** 启动游戏循环 */
  start(): void;
  /** 停止游戏循环 */
  stop(): void;
  /** 手动推进一帧（测试用） */
  tick(dtMs: number): void;

  /**
   * Run multiple ticks, yielding to the event loop between each frame.
   * Allows async operations (image loading, async onEnter) to complete.
   *
   * ```typescript
   * app.router.push(new GameScene(app));
   * await app.settle(120);  // run 120 frames, yielding between each
   * app.saveImage('screenshot.png');
   * ```
   */
  settle(frames?: number, intervalMs?: number): Promise<void>;

  /** 当前 FPS */
  readonly fps: number;

  /**
   * Render one frame without advancing game logic ($update / $fixedUpdate).
   * Use after programmatically setting scene state for screenshots or testing.
   *
   * ```typescript
   * app.timeScale = 0;
   * app.applyPreset('death');
   * app.renderOneFrame();
   * app.saveImage('death.png');
   * ```
   */
  renderOneFrame(): void;

  /**
   * Simulate a touch event at world coordinates.
   * Performs hitTest → emits touchstart + touchend on the hit node.
   *
   * ```typescript
   * app.simulateTouch(195, 506);
   * ```
   */
  simulateTouch(x: number, y: number): UINode | null;

  /**
   * Simulate a swipe gesture from one point to another.
   * Generates touchstart → touchmove × steps → touchend, ticking between moves.
   *
   * ```typescript
   * app.simulateSwipe(200, 700, 100, 700);        // left swipe, default 300ms
   * app.simulateSwipe(200, 700, 100, 700, 200);   // left swipe, 200ms
   * ```
   */
  simulateSwipe(fromX: number, fromY: number, toX: number, toY: number, durationMs?: number): void;

  /**
   * Wait until the current scene matches the given id.
   * Ticks the game loop internally, yielding between frames.
   *
   * ```typescript
   * tap(app, 'play-btn');
   * await app.waitForScene('game');
   * ```
   */
  waitForScene(sceneId: string, opts?: { timeout?: number }): Promise<void>;

  /**
   * Wait until a node matching the selector appears in the tree.
   * Supports id (#play), class name (Button), or descendant queries.
   *
   * ```typescript
   * await app.waitForNode('#score');
   * ```
   */
  waitForNode(selector: string, opts?: { timeout?: number }): Promise<UINode>;

  /**
   * Wait until a custom condition returns true.
   * Ticks the game loop internally.
   *
   * ```typescript
   * await app.waitForCondition(() =>
   *   parseInt(app.root.$query('#score')?.$text ?? '0') > 100
   * );
   * ```
   */
  waitForCondition(fn: () => boolean, opts?: { timeout?: number }): Promise<void>;

  /**
   * Apply a named preset on the current scene.
   * Scenes declare presets via `$presets()`.
   *
   * ```typescript
   * app.applyPreset('death');
   * app.renderOneFrame();
   * app.saveImage('death.png');
   * ```
   *
   * @returns preset names if no name given (discovery), true if applied, false if not found
   */
  applyPreset(name: string): boolean;

  /**
   * List available presets on the current scene.
   *
   * ```typescript
   * console.log(app.listPresets());
   * // ['gameplay', 'paused', 'death', 'transition']
   * ```
   */
  listPresets(): string[];

  /** 导出交互录制（debug 模式） */
  dumpInteractions(): InteractionRecord[];
  /** 清空交互录制 */
  clearInteractions(): void;

  /**
   * 回放交互录制 — AI 调试核心能力
   *
   * 暂停游戏循环 → 按录制时间差逐步回放 → 每步渲染 + 输出快照 → 恢复循环。
   * 用户可在屏幕上看到操作被"重演"。
   *
   * @param speed 回放速度（1 = 真实速度，2 = 两倍速，0.5 = 慢放）
   */
  replay(records: InteractionRecord[], speed?: number): Promise<ReplayStep[]>;
}

// ── Debug Overlay ──

function renderDebugOverlay(ctx: CanvasRenderingContext2D, node: UINode, offsetX = 0, offsetY = 0): void {
  if (!node.visible) return;

  const wx = offsetX + node.x;
  const wy = offsetY + node.y;

  // Draw bounding box if node has size
  if (node.width > 0 && node.height > 0) {
    ctx.save();
    ctx.strokeStyle = node.interactive ? 'rgba(76, 175, 80, 0.7)' : 'rgba(100, 149, 237, 0.4)';
    ctx.lineWidth = node.interactive ? 1.5 : 0.5;
    ctx.setLineDash(node.interactive ? [] : [3, 3]);
    ctx.strokeRect(wx + 0.5, wy + 0.5, node.width - 1, node.height - 1);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Draw ID label for named nodes
  if (node.id && node.width > 0) {
    const className = node.constructor.name;
    const label = className === 'UINode' ? `#${node.id}` : `${className}#${node.id}`;
    ctx.save();
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = node.interactive ? 'rgba(76, 175, 80, 0.8)' : 'rgba(100, 149, 237, 0.7)';
    ctx.fillRect(wx, wy, tw + 4, 12);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, wx + 2, wy + 1);
    ctx.restore();
  }

  // Recurse into children
  for (const child of node.$children) {
    renderDebugOverlay(ctx, child, wx, wy);
  }
}

export function createApp(options: AppOptions = {}): App {
  // 解析平台
  const platformName = options.platform ?? detectPlatform();

  let adapter: PlatformAdapter;
  if (options.adapter) {
    adapter = options.adapter;
  } else if (platformName === 'web') {
    if (!options.canvas) {
      throw new Error('[lucid] Web platform requires a canvas element. Use createApp({ canvas: ... })');
    }
    adapter = new WebAdapter(options.canvas);
  } else if (platformName === 'wx') {
    adapter = new WxAdapter();
  } else if (platformName === 'tt') {
    adapter = new TtAdapter();
  } else {
    throw new Error(`[lucid] Platform "${platformName}" adapter not yet implemented`);
  }

  const screen = adapter.getScreenInfo();
  const ctx = adapter.getCtx();

  // Asset root for loadImage() path resolution
  if (options.assetRoot != null) {
    setAssetRoot(options.assetRoot);
  }

  // 构建节点树
  const root = new UINode({ id: 'root', width: screen.width, height: screen.height });
  const router = new SceneRouter();
  root.addChild(router);

  // 全局 RNG
  const rng = new SeededRNG(options.rngSeed);

  // 交互录制器
  const debugMode = options.debug ?? false;
  let overlayMode = options.debugOverlay ?? false;
  let _timeScale = 1;
  let _fixedTimestep = options.fixedTimestep ?? 0;
  let _fixedAccumulator = 0;
  const recorder = new InteractionRecorder({ enabled: debugMode });
  let startTime = 0;

  // Touch log for debug dump (last 20 touches)
  interface TouchLogEntry { time: string; x: number; y: number; hit: string; scene: string; }
  const _touchLog: TouchLogEntry[] = [];

  // Enable SceneRouter debug logging
  if (debugMode) router.debug = true;

  // 触摸桥接（capture 模式：touchstart 确定目标，后续 move/end 始终发往同一节点）
  let capturedNode: UINode | null = null;

  adapter.bindTouchEvents({
    onStart: (x, y) => {
      const hit = root.hitTest(x, y);
      capturedNode = hit;
      if (debugMode) {
        if (hit) {
          recorder.record({
            t: Date.now() - startTime,
            type: 'touchstart',
            x, y,
            path: hit.$path(),
            snapshot: hit.$inspect(0),
          });
        }
        _touchLog.push({
          time: new Date().toISOString().split('T')[1].slice(0, 12),
          x: Math.round(x), y: Math.round(y),
          hit: hit?.id || hit?.$type || '(miss)',
          scene: router.current?.id ?? '(none)',
        });
        if (_touchLog.length > 20) _touchLog.shift();
      }
      if (hit) {
        const local = hit.worldToLocal(x, y);
        hit.$emit('touchstart', { x, y, localX: local.x, localY: local.y, worldX: x, worldY: y });
      }
    },
    onMove: (x, y) => {
      // 节点可能在场景切换时被移除，检查 parent 链是否完整
      if (capturedNode && !capturedNode.$parent) capturedNode = null;
      if (debugMode) {
        recorder.record({ t: Date.now() - startTime, type: 'touchmove', x, y, path: capturedNode?.$path() ?? '' });
      }
      if (capturedNode) {
        const local = capturedNode.worldToLocal(x, y);
        capturedNode.$emit('touchmove', { x, y, localX: local.x, localY: local.y, worldX: x, worldY: y });
      }
    },
    onEnd: (x, y) => {
      const node = capturedNode ?? root.hitTest(x, y);
      capturedNode = null;
      if (debugMode && node) {
        recorder.record({
          t: Date.now() - startTime,
          type: 'touchend',
          x, y,
          path: node.$path(),
          snapshot: node.$inspect(0),
        });
      }
      if (node) {
        const local = node.worldToLocal(x, y);
        node.$emit('touchend', { x, y, localX: local.x, localY: local.y, worldX: x, worldY: y });
      }
    },
  });

  // FPS 监控
  let _fps = 0;
  let _fpsFrames = 0;
  let _fpsTime = 0;

  // 游戏循环
  let rafId: number | null = null;
  let lastTime = 0;
  const MAX_DT = 100; // ms

  function frame(timestamp: number): void {
    const rawDt = lastTime === 0 ? 16 : timestamp - lastTime;
    const dtMs = Math.min(rawDt, MAX_DT);
    lastTime = timestamp;

    // FPS 计算
    _fpsFrames++;
    _fpsTime += dtMs;
    if (_fpsTime >= 1000) {
      _fps = Math.round(_fpsFrames * 1000 / _fpsTime);
      _fpsFrames = 0;
      _fpsTime = 0;
    }

    tick(dtMs);

    rafId = adapter.requestAnimationFrame(frame);
  }

  function tick(dtMs: number): void {
    const dt = (dtMs / 1000) * _timeScale;

    // Fixed timestep: deterministic physics updates
    if (_fixedTimestep > 0 && dt > 0) {
      _fixedAccumulator += dt;
      while (_fixedAccumulator >= _fixedTimestep) {
        root.$fixedUpdate(_fixedTimestep);
        _fixedAccumulator -= _fixedTimestep;
      }
    }

    // Variable update: rendering, animations, UI
    root.$update(dt);

    // 清屏需要用 save/restore 因为 ctx 被 scale 了
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
    ctx.clearRect(0, 0, screen.width * screen.dpr, screen.height * screen.dpr);
    ctx.restore();

    root.$render(ctx);

    // Debug overlay: node boundaries + IDs
    if (overlayMode) {
      renderDebugOverlay(ctx, root);
    }

    // Debug 模式：绘制 FPS（仅在 rAF 游戏循环运行时，手动 tick/settle 不显示）
    if (debugMode && rafId !== null) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(screen.width - 60, 4, 56, 20);
      ctx.fillStyle = _fps >= 55 ? '#4caf50' : _fps >= 30 ? '#ff9800' : '#f44336';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${_fps} FPS`, screen.width - 8, 14);
      ctx.restore();
    }
  }

  const app: App = {
    root,
    router,
    screen,
    rng,
    canvas: adapter.getCanvas(),

    get debug() { return recorder.enabled; },
    set debug(v: boolean) { recorder.enabled = v; },

    get debugOverlay() { return overlayMode; },
    set debugOverlay(v: boolean) { overlayMode = v; },

    get timeScale() { return _timeScale; },
    set timeScale(v: number) { _timeScale = Math.max(0, v); },

    get fixedTimestep() { return _fixedTimestep; },
    set fixedTimestep(v: number) { _fixedTimestep = Math.max(0, v); _fixedAccumulator = 0; },

    get fps() { return _fps; },

    start() {
      startTime = Date.now();
      lastTime = 0;
      // 录制 RNG 种子（回放时用于恢复随机序列）
      if (recorder.enabled) {
        recorder.record({ t: 0, type: 'meta', x: 0, y: 0, path: '', meta: { rngSeed: rng.seed } });
      }
      rafId = adapter.requestAnimationFrame(frame);
    },

    stop() {
      if (rafId !== null) {
        adapter.cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    tick(dtMs: number) {
      tick(dtMs);
    },

    async settle(frames = 60, intervalMs = 16) {
      for (let i = 0; i < frames; i++) {
        tick(intervalMs);
        // Yield to event loop — lets Promises, img.onload, setTimeout callbacks run
        await new Promise(r => setTimeout(r, 0));
      }
    },

    renderOneFrame() {
      // Clear screen
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, screen.width * screen.dpr, screen.height * screen.dpr);
      ctx.restore();
      // Render tree (no $update / $fixedUpdate)
      root.$render(ctx);
      // Debug overlay
      if (overlayMode) {
        renderDebugOverlay(ctx, root);
      }
    },

    simulateTouch(x: number, y: number): UINode | null {
      const hit = root.hitTest(x, y);
      if (!hit) return null;
      const local = hit.worldToLocal(x, y);
      const event = { x, y, localX: local.x, localY: local.y, worldX: x, worldY: y };
      hit.$emit('touchstart', event);
      hit.$emit('touchend', event);
      return hit;
    },

    simulateSwipe(fromX: number, fromY: number, toX: number, toY: number, durationMs = 300): void {
      const steps = Math.max(1, Math.round(durationMs / 16));
      const dtPerStep = durationMs / steps;

      // touchstart at origin
      const startHit = root.hitTest(fromX, fromY);
      if (startHit) {
        const local = startHit.worldToLocal(fromX, fromY);
        startHit.$emit('touchstart', { x: fromX, y: fromY, localX: local.x, localY: local.y, worldX: fromX, worldY: fromY });
      }

      // touchmove interpolated steps + tick between each
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mx = fromX + (toX - fromX) * t;
        const my = fromY + (toY - fromY) * t;
        const moveHit = root.hitTest(mx, my);
        if (moveHit) {
          const local = moveHit.worldToLocal(mx, my);
          moveHit.$emit('touchmove', { x: mx, y: my, localX: local.x, localY: local.y, worldX: mx, worldY: my });
        }
        tick(dtPerStep);
      }

      // touchend at destination
      const endHit = root.hitTest(toX, toY);
      if (endHit) {
        const local = endHit.worldToLocal(toX, toY);
        endHit.$emit('touchend', { x: toX, y: toY, localX: local.x, localY: local.y, worldX: toX, worldY: toY });
      }
    },

    async waitForScene(sceneId: string, opts?: { timeout?: number }): Promise<void> {
      const timeout = opts?.timeout ?? 5000;
      let elapsed = 0;
      const dt = 16;
      while (router.current?.id !== sceneId) {
        if (elapsed >= timeout) {
          throw new Error(`[lucid] waitForScene('${sceneId}') timed out after ${timeout}ms (current: ${router.current?.id ?? 'none'})`);
        }
        tick(dt);
        elapsed += dt;
        await new Promise(r => setTimeout(r, 0));
      }
    },

    async waitForNode(selector: string, opts?: { timeout?: number }): Promise<UINode> {
      const timeout = opts?.timeout ?? 5000;
      let elapsed = 0;
      const dt = 16;
      while (true) {
        // #id → findById (fast), otherwise $query
        const found = selector.startsWith('#')
          ? root.findById(selector.slice(1))
          : root.$query(selector)[0] ?? null;
        if (found) return found;
        if (elapsed >= timeout) {
          throw new Error(`[lucid] waitForNode('${selector}') timed out after ${timeout}ms`);
        }
        tick(dt);
        elapsed += dt;
        await new Promise(r => setTimeout(r, 0));
      }
    },

    async waitForCondition(fn: () => boolean, opts?: { timeout?: number }): Promise<void> {
      const timeout = opts?.timeout ?? 5000;
      let elapsed = 0;
      const dt = 16;
      while (!fn()) {
        if (elapsed >= timeout) {
          throw new Error(`[lucid] waitForCondition timed out after ${timeout}ms`);
        }
        tick(dt);
        elapsed += dt;
        await new Promise(r => setTimeout(r, 0));
      }
    },

    applyPreset(name: string): boolean {
      const scene = router.current;
      if (!scene) return false;
      const presets = scene.$presets?.();
      if (!presets || !presets[name]) return false;
      presets[name].setup(scene);
      return true;
    },

    listPresets(): string[] {
      const scene = router.current;
      if (!scene) return [];
      const presets = scene.$presets?.();
      if (!presets) return [];
      return Object.keys(presets);
    },

    dumpInteractions() { return recorder.dump(); },
    clearInteractions() { recorder.clear(); },

    async replay(records: InteractionRecord[], speed = 1): Promise<ReplayStep[]> {
      // 暂停游戏循环，由回放接管渲染
      const wasRunning = rafId !== null;
      if (wasRunning) app.stop();

      const steps: ReplayStep[] = [];
      let prevT = 0;

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];

        // 恢复 RNG 种子
        if (rec.type === 'meta' && rec.meta?.rngSeed) {
          (rng as any)._state = rec.meta.rngSeed;
          continue;
        }

        // 按真实时间差等待（除以速度倍率）
        const dt = rec.t - prevT;
        if (dt > 0) {
          const waitMs = dt / speed;
          // 分帧推进游戏时间（保持物理/动画精度）
          let simulated = 0;
          while (simulated < dt) {
            const frameDt = Math.min(16, dt - simulated);
            tick(frameDt);
            simulated += frameDt;
          }
          // 等待真实时间（让用户看到渲染结果）
          await new Promise(r => setTimeout(r, waitMs));
        }
        prevT = rec.t;

        // 在录制坐标做 hitTest 并触发事件
        const hit = root.hitTest(rec.x, rec.y);
        const actualPath = hit?.$path() ?? '(miss)';
        const snapshot = hit?.$inspect(0) ?? '(miss)';

        if (hit) {
          const local = hit.worldToLocal(rec.x, rec.y);
          hit.$emit(rec.type, { localX: local.x, localY: local.y, worldX: rec.x, worldY: rec.y });
        }

        // 再推一帧让事件效果（弹窗打开、场景切换等）渲染出来
        tick(16);

        steps.push({
          step: i + 1,
          t: rec.t,
          dt,
          type: rec.type,
          recordedPath: rec.path,
          actualPath,
          snapshot,
          pathMatch: rec.path === actualPath,
          treeSnapshot: root.$inspect(2),
        });
      }

      // 恢复游戏循环
      if (wasRunning) app.start();

      return steps;
    },

    debugPanel: null as DebugPanel | null,
    /** @internal Touch log for DebugPanel */
    get __touchLog() { return _touchLog; },
  };

  // Attach debug panel if requested
  if (options.debugPanel) {
    (app as any).debugPanel = attachDebugPanel(app);
  }

  return app;
}
