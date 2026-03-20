/**
 * createApp — Lucid 应用入口
 *
 * 借鉴 Vue 的 createApp：一行启动整个游戏。
 */

import { UINode, InteractionRecorder, SeededRNG, type InteractionRecord } from '@lucid/core';
import { SceneRouter } from './scene.js';
import { detectPlatform, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
import { WebAdapter } from './platform/web.js';

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
  /** RNG 种子（不指定则自动生成） */
  rngSeed?: number;
}

export interface App {
  readonly root: UINode;
  readonly router: SceneRouter;
  readonly screen: ScreenInfo;
  /** 全局可复现随机数生成器 */
  readonly rng: SeededRNG;
  debug: boolean;

  /** 启动游戏循环 */
  start(): void;
  /** 停止游戏循环 */
  stop(): void;
  /** 手动推进一帧（测试用） */
  tick(dtMs: number): void;

  /** 当前 FPS */
  readonly fps: number;

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
  } else {
    // TODO: wx/tt adapters
    throw new Error(`[lucid] Platform "${platformName}" adapter not yet implemented`);
  }

  const screen = adapter.getScreenInfo();
  const ctx = adapter.getCtx();

  // 构建节点树
  const root = new UINode({ id: 'root', width: screen.width, height: screen.height });
  const router = new SceneRouter();
  root.addChild(router);

  // 全局 RNG
  const rng = new SeededRNG(options.rngSeed);

  // 交互录制器
  const debugMode = options.debug ?? false;
  const recorder = new InteractionRecorder({ enabled: debugMode });
  let startTime = 0;

  // 触摸桥接（capture 模式：touchstart 确定目标，后续 move/end 始终发往同一节点）
  let capturedNode: UINode | null = null;

  adapter.bindTouchEvents({
    onStart: (x, y) => {
      const hit = root.hitTest(x, y);
      capturedNode = hit;
      if (debugMode && hit) {
        recorder.record({
          t: Date.now() - startTime,
          type: 'touchstart',
          x, y,
          path: hit.$path(),
          snapshot: hit.$inspect(0),
        });
      }
      if (hit) {
        const local = hit.worldToLocal(x, y);
        hit.$emit('touchstart', { localX: local.x, localY: local.y, worldX: x, worldY: y });
      }
    },
    onMove: (x, y) => {
      if (debugMode) {
        recorder.record({ t: Date.now() - startTime, type: 'touchmove', x, y, path: capturedNode?.$path() ?? '' });
      }
      if (capturedNode) {
        const local = capturedNode.worldToLocal(x, y);
        capturedNode.$emit('touchmove', { localX: local.x, localY: local.y, worldX: x, worldY: y });
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
        node.$emit('touchend', { localX: local.x, localY: local.y, worldX: x, worldY: y });
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
    const dt = dtMs / 1000;
    root.$update(dt);

    // 清屏需要用 save/restore 因为 ctx 被 scale 了
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
    ctx.clearRect(0, 0, screen.width * screen.dpr, screen.height * screen.dpr);
    ctx.restore();

    root.$render(ctx);

    // Debug 模式：绘制 FPS
    if (debugMode) {
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

    get debug() { return recorder.enabled; },
    set debug(v: boolean) { recorder.enabled = v; },

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
  };

  return app;
}
