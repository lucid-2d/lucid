/**
 * SceneNode + SceneRouter — 场景即路由即 UINode
 *
 * 场景是特殊的 UINode：
 * - 有 onEnter/onExit/onPause/onResume 生命周期
 * - 由 SceneRouter 管理（push/pop/replace）
 * - SceneRouter 自身也是 UINode（场景作为子节点）
 * - 支持过渡动画（fade/slide）
 */

import { UINode, type UINodeOptions } from '@lucid-2d/core';

export interface ScenePreset<T extends SceneNode = SceneNode> {
  /** Human-readable description (shown in $inspect) */
  label?: string;
  /** Setup function — mutate the scene to reach this state (method syntax for bivariant type checking) */
  setup(scene: T): void;
}

export class SceneNode extends UINode {
  /** 进入场景时调用（首次推入或 replace 到） */
  onEnter(): void {}
  /** 离开场景时调用（pop 或被 replace） */
  onExit(): void {}
  /** 有新场景压在上面时调用 */
  onPause(): void {}
  /** 上面的场景弹出后恢复时调用 */
  onResume(): void {}

  /**
   * Declare preset states for AI inspection, testing, and screenshots.
   *
   * Override in subclasses to declare states that can be programmatically triggered:
   * ```typescript
   * class GameScene extends SceneNode {
   *   $presets() {
   *     return {
   *       paused: { label: '暂停', setup: (s) => s.togglePause() },
   *       death:  { label: '死亡', setup: (s) => { s.ship.died = true; } },
   *     };
   *   }
   * }
   * ```
   */
  $presets(): Record<string, ScenePreset<this>> | null {
    return null;
  }

  constructor(opts?: UINodeOptions) {
    super(opts);
  }
}

// ── Transition ──

export type TransitionType = 'none' | 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'custom';

export interface TransitionOptions {
  /** Transition type (default: 'none') */
  type?: TransitionType;
  /** Duration in milliseconds (default: 300) */
  duration?: number;
  /** Custom transition render function (used when type='custom') */
  render?: (ctx: CanvasRenderingContext2D, progress: number, oldScene: SceneNode | null, newScene: SceneNode) => void;
}

interface ActiveTransition {
  type: TransitionType;
  duration: number;   // seconds
  elapsed: number;    // seconds
  oldScene: SceneNode | null;
  newScene: SceneNode;
  /** Original positions to restore after transition */
  oldOrigX: number;
  oldOrigY: number;
  oldOrigAlpha: number;
  /** Callback when transition completes */
  onComplete: () => void;
  /** Custom render function (for type='custom') */
  customRender?: (ctx: CanvasRenderingContext2D, progress: number, oldScene: SceneNode | null, newScene: SceneNode) => void;
}

/**
 * SceneRouter — 场景栈管理器，本身是 UINode
 *
 * 类似 SPA 路由：push = 打开新页面，pop = 返回，replace = 替换当前
 * 场景作为 Router 的子节点，天然参与 $render / $update / $inspect
 *
 * 过渡动画：
 * ```typescript
 * router.push(scene, { type: 'fade', duration: 300 });
 * router.replace(scene, { type: 'slideLeft', duration: 500 });
 * ```
 */
export interface SceneLogEntry {
  time: string;
  action: 'push' | 'pop' | 'replace';
  scene: string;
  depth: number;
}

export class SceneRouter extends UINode {
  private stack: SceneNode[] = [];
  private _transition: ActiveTransition | null = null;
  private _log: SceneLogEntry[] = [];
  private _debug = false;

  /** Default transition for all operations (can be overridden per-call) */
  defaultTransition: TransitionOptions = { type: 'none' };

  constructor() {
    super({ id: 'router' });
  }

  /** Enable/disable lifecycle logging */
  set debug(v: boolean) { this._debug = v; }

  /** Scene lifecycle log (debug mode only) */
  get log(): readonly SceneLogEntry[] { return this._log; }

  private _logAction(action: SceneLogEntry['action'], scene: SceneNode): void {
    if (!this._debug) return;
    this._log.push({
      time: new Date().toISOString().split('T')[1].slice(0, 12),
      action,
      scene: scene.id || scene.$type,
      depth: this.stack.length,
    });
    // Keep last 30 entries
    if (this._log.length > 30) this._log.shift();
  }

  /** 当前活跃场景 */
  get current(): SceneNode | undefined {
    return this.stack[this.stack.length - 1];
  }

  /** 场景栈深度 */
  get depth(): number {
    return this.stack.length;
  }

  /** Whether a transition is currently playing */
  get transitioning(): boolean {
    return this._transition !== null;
  }

  /** hitTest only targets the top scene (paused scenes don't receive events) */
  hitTest(wx: number, wy: number): UINode | null {
    if (!this.visible) return null;
    const scene = this.current;
    if (!scene) return null;
    return scene.hitTest(wx - this.x, wy - this.y);
  }

  protected $inspectInfo(): string {
    const parts: string[] = [];
    if (this._transition) {
      parts.push(`transition:${this._transition.type}`);
    }
    return parts.join(' ');
  }

  /** 压入新场景（暂停当前，进入新场景） */
  push(scene: SceneNode, transition?: TransitionOptions): void {
    const oldScene = this.current ?? null;
    oldScene?.onPause();
    this.stack.push(scene);
    this.addChild(scene);
    scene.onEnter();
    this._logAction('push', scene);

    this._startTransition(oldScene, scene, transition, () => {
      // Push transition complete — old scene stays in tree but paused
    });
  }

  /** 弹出栈顶场景（退出当前，恢复前一个） */
  pop(transition?: TransitionOptions): SceneNode | undefined {
    if (this.stack.length === 0) return undefined;

    const oldScene = this.stack.pop()!;
    oldScene.onExit();
    this._logAction('pop', oldScene);
    const newScene = this.current;
    newScene?.onResume();

    if (this._resolveTransition(oldScene, newScene, transition)) {
      return oldScene;
    }

    this.removeChild(oldScene);
    return oldScene;
  }

  /** 替换栈顶场景 */
  replace(scene: SceneNode, transition?: TransitionOptions): void {
    const oldScene = this.stack.pop() ?? null;
    if (oldScene) oldScene.onExit();

    this.stack.push(scene);
    this.addChild(scene);
    scene.onEnter();
    this._logAction('replace', scene);

    if (this._resolveTransition(oldScene, scene, transition)) {
      return;
    }

    if (oldScene) this.removeChild(oldScene);
  }

  $update(dt: number): void {
    super.$update(dt);

    if (!this._transition) return;

    const t = this._transition;
    t.elapsed += dt;
    const progress = Math.min(1, t.elapsed / t.duration);

    this._applyTransition(t, progress);

    if (progress >= 1) {
      this._finishTransition();
    }
  }

  private _startTransition(
    oldScene: SceneNode | null,
    newScene: SceneNode,
    opts: TransitionOptions | undefined,
    onComplete: () => void,
  ): void {
    const merged = { ...this.defaultTransition, ...opts };
    const type = merged.type ?? 'none';
    const duration = (merged.duration ?? 300) / 1000;

    // Cancel any in-progress transition
    if (this._transition) this._finishTransition();

    if (type === 'none' || duration <= 0) {
      onComplete();
      return;
    }

    this._transition = {
      type,
      duration,
      elapsed: 0,
      oldScene,
      newScene,
      oldOrigX: oldScene?.x ?? 0,
      oldOrigY: oldScene?.y ?? 0,
      oldOrigAlpha: oldScene?.alpha ?? 1,
      onComplete,
      customRender: merged.render,
    };

    // Set initial state for new scene
    this._applyTransition(this._transition, 0);
  }

  private _resolveTransition(
    oldScene: SceneNode | null,
    newScene: SceneNode | undefined,
    opts: TransitionOptions | undefined,
  ): boolean {
    const merged = { ...this.defaultTransition, ...opts };
    const type = merged.type ?? 'none';
    const duration = (merged.duration ?? 300) / 1000;

    if (type === 'none' || duration <= 0 || !oldScene) return false;

    if (this._transition) this._finishTransition();

    this._transition = {
      type,
      duration,
      elapsed: 0,
      oldScene,
      newScene: newScene ?? oldScene,
      oldOrigX: oldScene.x,
      oldOrigY: oldScene.y,
      oldOrigAlpha: oldScene.alpha,
      onComplete: () => {
        this.removeChild(oldScene);
      },
      customRender: merged.render,
    };

    this._applyTransition(this._transition, 0);
    return true;
  }

  private _applyTransition(t: ActiveTransition, progress: number): void {
    const ease = progress; // linear, simple and predictable

    switch (t.type) {
      case 'fade': {
        if (t.oldScene) t.oldScene.alpha = 1 - ease;
        t.newScene.alpha = ease;
        break;
      }
      case 'slideLeft': {
        const w = t.newScene.width || 390;
        if (t.oldScene) t.oldScene.x = t.oldOrigX - w * ease;
        t.newScene.x = w * (1 - ease);
        break;
      }
      case 'slideRight': {
        const w = t.newScene.width || 390;
        if (t.oldScene) t.oldScene.x = t.oldOrigX + w * ease;
        t.newScene.x = -w * (1 - ease);
        break;
      }
      case 'slideUp': {
        const h = t.newScene.height || 844;
        if (t.oldScene) t.oldScene.y = t.oldOrigY - h * ease;
        t.newScene.y = h * (1 - ease);
        break;
      }
      case 'slideDown': {
        const h = t.newScene.height || 844;
        if (t.oldScene) t.oldScene.y = t.oldOrigY + h * ease;
        t.newScene.y = -h * (1 - ease);
        break;
      }
      case 'custom': {
        // Custom render is called during $render via _renderCustomTransition
        // Hide both scenes from normal rendering — custom render takes over
        if (t.oldScene) t.oldScene.alpha = 0;
        t.newScene.alpha = 0;
        break;
      }
    }
  }

  /** Called after normal render to draw custom transition overlay */
  $render(ctx: CanvasRenderingContext2D): void {
    super.$render(ctx);

    if (this._transition?.type === 'custom' && this._transition.customRender) {
      const t = this._transition;
      const progress = Math.min(1, t.elapsed / t.duration);
      t.customRender!(ctx, progress, t.oldScene, t.newScene);
    }
  }

  private _finishTransition(): void {
    if (!this._transition) return;

    const t = this._transition;

    // Restore final state
    if (t.oldScene) {
      t.oldScene.x = t.oldOrigX;
      t.oldScene.y = t.oldOrigY;
      t.oldScene.alpha = t.oldOrigAlpha;
    }
    t.newScene.alpha = 1;
    t.newScene.x = 0;
    t.newScene.y = 0;

    t.onComplete();
    this._transition = null;
  }
}
