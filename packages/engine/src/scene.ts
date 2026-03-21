/**
 * SceneNode + SceneRouter — 场景即路由即 UINode
 *
 * 场景是特殊的 UINode：
 * - 有 onEnter/onExit/onPause/onResume 生命周期
 * - 由 SceneRouter 管理（push/pop/replace）
 * - SceneRouter 自身也是 UINode（场景作为子节点）
 * - 支持过渡动画（fade/slide）
 */

import { UINode, type UINodeOptions } from '@lucid/core';

export class SceneNode extends UINode {
  /** 进入场景时调用（首次推入或 replace 到） */
  onEnter(): void {}
  /** 离开场景时调用（pop 或被 replace） */
  onExit(): void {}
  /** 有新场景压在上面时调用 */
  onPause(): void {}
  /** 上面的场景弹出后恢复时调用 */
  onResume(): void {}

  constructor(opts?: UINodeOptions) {
    super(opts);
  }
}

// ── Transition ──

export type TransitionType = 'none' | 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown';

export interface TransitionOptions {
  /** Transition type (default: 'none') */
  type?: TransitionType;
  /** Duration in milliseconds (default: 300) */
  duration?: number;
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
export class SceneRouter extends UINode {
  private stack: SceneNode[] = [];
  private _transition: ActiveTransition | null = null;

  /** Default transition for all operations (can be overridden per-call) */
  defaultTransition: TransitionOptions = { type: 'none' };

  constructor() {
    super({ id: 'router' });
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

  /** 压入新场景（暂停当前，进入新场景） */
  push(scene: SceneNode, transition?: TransitionOptions): void {
    const oldScene = this.current ?? null;
    oldScene?.onPause();
    this.stack.push(scene);
    this.addChild(scene);
    scene.onEnter();

    this._startTransition(oldScene, scene, transition, () => {
      // Push transition complete — old scene stays in tree but paused
    });
  }

  /** 弹出栈顶场景（退出当前，恢复前一个） */
  pop(transition?: TransitionOptions): SceneNode | undefined {
    if (this.stack.length === 0) return undefined;

    const oldScene = this.stack.pop()!;
    oldScene.onExit();
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
