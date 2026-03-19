/**
 * createApp — Lucid 应用入口
 *
 * 借鉴 Vue 的 createApp：一行启动整个游戏。
 */

import { UINode, InteractionRecorder, type InteractionRecord } from '@lucid/core';
import { SceneRouter } from './scene.js';
import { detectPlatform, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
import { WebAdapter } from './platform/web.js';

export interface AppOptions {
  /** 手动指定平台，不指定则自动检测 */
  platform?: 'wx' | 'tt' | 'web';
  /** Web 模式下指定 canvas */
  canvas?: HTMLCanvasElement;
  /** 自定义适配器 */
  adapter?: PlatformAdapter;
  /** 调试模式 */
  debug?: boolean;
}

export interface App {
  readonly root: UINode;
  readonly router: SceneRouter;
  readonly screen: ScreenInfo;
  debug: boolean;

  /** 启动游戏循环 */
  start(): void;
  /** 停止游戏循环 */
  stop(): void;
  /** 手动推进一帧（测试用） */
  tick(dtMs: number): void;

  /** 导出交互录制（debug 模式） */
  dumpInteractions(): InteractionRecord[];
  /** 清空交互录制 */
  clearInteractions(): void;
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

  // 交互录制器
  const debugMode = options.debug ?? false;
  const recorder = new InteractionRecorder({ enabled: debugMode });
  let startTime = 0;

  // 触摸桥接
  adapter.bindTouchEvents({
    onStart: (x, y) => {
      const hit = root.hitTest(x, y);
      if (debugMode && hit) {
        recorder.record({
          t: Date.now() - startTime,
          type: 'touchstart',
          x, y,
          path: hit.$path(),
          snapshot: hit.$inspect(0),
        });
      }
      if (hit) hit.$emit('touchstart', { localX: 0, localY: 0, worldX: x, worldY: y });
    },
    onMove: (x, y) => {
      // touchmove 暂不分发到节点（避免性能问题），仅录制
      if (debugMode) {
        recorder.record({ t: Date.now() - startTime, type: 'touchmove', x, y, path: '' });
      }
    },
    onEnd: (x, y) => {
      const hit = root.hitTest(x, y);
      if (debugMode && hit) {
        recorder.record({
          t: Date.now() - startTime,
          type: 'touchend',
          x, y,
          path: hit.$path(),
          snapshot: hit.$inspect(0),
        });
      }
      if (hit) hit.$emit('touchend', { localX: 0, localY: 0, worldX: x, worldY: y });
    },
  });

  // 游戏循环
  let rafId: number | null = null;
  let lastTime = 0;
  const MAX_DT = 100; // ms

  function frame(timestamp: number): void {
    const rawDt = lastTime === 0 ? 16 : timestamp - lastTime;
    const dtMs = Math.min(rawDt, MAX_DT);
    lastTime = timestamp;

    tick(dtMs);

    rafId = adapter.requestAnimationFrame(frame);
  }

  function tick(dtMs: number): void {
    const dt = dtMs / 1000; // UINode.$update 用秒
    root.$update(dt);

    ctx.clearRect(0, 0, screen.width, screen.height);
    root.$render(ctx);
  }

  const app: App = {
    root,
    router,
    screen,

    get debug() { return recorder.enabled; },
    set debug(v: boolean) { recorder.enabled = v; },

    start() {
      startTime = Date.now();
      lastTime = 0;
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
  };

  return app;
}
