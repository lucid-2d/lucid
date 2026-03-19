/**
 * UINode — Canvas 世界的 "DOM 节点"
 *
 * 提供：树结构、坐标变换、hitTest、脏标记、事件、生命周期
 */

import { EventEmitter } from './events.js';
import { resolveEasing } from './easing.js';
import type { EasingName, EasingFn } from './easing.js';
import type { Point } from './types.js';

// ── 动画内部类型 ───────────────────────────────

interface AnimateProp {
  key: string;
  from: number;
  to: number;
}

interface ActiveAnimation {
  props: AnimateProp[];
  duration: number;    // 秒
  easing: EasingFn;
  delay: number;       // 秒
  elapsed: number;
  resolve: () => void;
  stopped: boolean;
}

export interface AnimateOptions {
  duration?: number;         // 毫秒，默认 300
  easing?: EasingName | EasingFn;  // 默认 'easeOutCubic'
  delay?: number;            // 毫秒，默认 0
}

export interface Animation {
  finished: Promise<void>;
  stop(): void;
  finish(): void;
}

export interface UINodeOptions {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export class UINode extends EventEmitter {
  id: string;
  $parent: UINode | null = null;
  private _children: UINode[] = [];

  x: number;
  y: number;
  width: number;
  height: number;

  visible = true;
  interactive = false;
  alpha = 1;

  protected _dirty = true;
  private _animations: ActiveAnimation[] = [];

  constructor(opts?: UINodeOptions) {
    super();
    this.id = opts?.id ?? '';
    this.x = opts?.x ?? 0;
    this.y = opts?.y ?? 0;
    this.width = opts?.width ?? 0;
    this.height = opts?.height ?? 0;
  }

  // ── 树结构 ──────────────────────────────────

  get $children(): readonly UINode[] {
    return this._children;
  }

  addChild(child: UINode, index?: number): this {
    // 从旧父节点移除
    if (child.$parent) {
      child.$parent.removeChild(child);
    }

    child.$parent = this;
    if (index !== undefined && index >= 0 && index < this._children.length) {
      this._children.splice(index, 0, child);
    } else {
      this._children.push(child);
    }

    // 触发 onMounted（递归子树）
    this._mountRecursive(child);

    return this;
  }

  removeChild(child: UINode): this {
    const idx = this._children.indexOf(child);
    if (idx === -1) return this;

    this._children.splice(idx, 1);
    child.$parent = null;

    // 触发 onUnmounted（递归子树）
    this._unmountRecursive(child);

    return this;
  }

  removeFromParent(): void {
    if (this.$parent) {
      this.$parent.removeChild(this);
    }
  }

  findById(id: string): UINode | null {
    if (this.id === id) return this;
    for (const child of this._children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  findByType<T extends UINode>(ctor: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    this._collectByType(ctor, result);
    return result;
  }

  private _collectByType<T extends UINode>(ctor: new (...args: any[]) => T, result: T[]): void {
    for (const child of this._children) {
      if (child instanceof ctor) result.push(child);
      child._collectByType(ctor, result);
    }
  }

  // ── 生命周期 ────────────────────────────────

  /** 被加入树时调用 */
  onMounted(): void {}
  /** 被移出树时调用 */
  onUnmounted(): void {}
  /** update 前调用 */
  onBeforeUpdate(): void {}
  /** update 后调用 */
  onUpdated(): void {}

  private _mountRecursive(node: UINode): void {
    node.onMounted();
    for (const child of node._children) {
      this._mountRecursive(child);
    }
  }

  private _unmountRecursive(node: UINode): void {
    node.onUnmounted();
    for (const child of node._children) {
      this._unmountRecursive(child);
    }
  }

  // ── 脏标记 ──────────────────────────────────

  protected markDirty(): void {
    this._dirty = true;
  }

  /** 子类重写：脏标记清除时重新计算布局 */
  protected onLayout(): void {}

  // ── 动画 ────────────────────────────────────

  $animate(props: Record<string, number>, options?: AnimateOptions): Animation {
    const duration = ((options?.duration ?? 300) / 1000);
    const delay = ((options?.delay ?? 0) / 1000);
    const easing = resolveEasing(options?.easing ?? 'easeOutCubic');

    const animProps: AnimateProp[] = Object.entries(props).map(([key, to]) => ({
      key,
      from: (this as any)[key] as number,
      to,
    }));

    // 取消同属性的旧动画
    const newKeys = new Set(animProps.map(p => p.key));
    for (const existing of this._animations) {
      if (existing.props.some(p => newKeys.has(p.key))) {
        existing.stopped = true;
      }
    }

    let resolvePromise!: () => void;
    const finished = new Promise<void>(r => { resolvePromise = r; });

    const anim: ActiveAnimation = {
      props: animProps,
      duration,
      easing,
      delay,
      elapsed: 0,
      resolve: resolvePromise,
      stopped: false,
    };

    this._animations.push(anim);

    const stop = () => {
      anim.stopped = true;
      resolvePromise();
    };

    const finish = () => {
      for (const prop of anim.props) {
        (this as any)[prop.key] = prop.to;
      }
      anim.stopped = true;
      resolvePromise();
    };

    return { finished, stop, finish };
  }

  private _updateAnimations(dt: number): void {
    for (let i = this._animations.length - 1; i >= 0; i--) {
      const anim = this._animations[i];
      if (anim.stopped) {
        this._animations.splice(i, 1);
        continue;
      }

      anim.elapsed += dt;

      if (anim.elapsed < anim.delay) continue;

      const rawT = Math.min(1, (anim.elapsed - anim.delay) / anim.duration);
      const easedT = anim.easing(rawT);

      for (const prop of anim.props) {
        (this as any)[prop.key] = prop.from + (prop.to - prop.from) * easedT;
      }

      if (rawT >= 1) {
        // 精确设置终值
        for (const prop of anim.props) {
          (this as any)[prop.key] = prop.to;
        }
        this._animations.splice(i, 1);
        anim.resolve();
      }
    }
  }

  // ── 渲染 ────────────────────────────────────

  /** 子类重写：绘制自身内容。ctx 已变换到节点本地坐标。 */
  protected draw(_ctx: CanvasRenderingContext2D): void {}

  /** 框架调用：递归渲染整棵树 */
  $render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    if (this._dirty) {
      this.onLayout();
      this._dirty = false;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha *= this.alpha;

    this.draw(ctx);

    for (const child of this._children) {
      child.$render(ctx);
    }

    ctx.restore();
  }

  // ── update ──────────────────────────────────

  /** 框架调用：每帧更新 */
  $update(dt: number): void {
    if (!this.visible) return;

    this._updateAnimations(dt);
    this.onBeforeUpdate();

    for (const child of this._children) {
      child.$update(dt);
    }

    this.onUpdated();
  }

  // ── hitTest ─────────────────────────────────

  /** 点击测试（世界坐标），返回最上层命中的 interactive 节点 */
  hitTest(wx: number, wy: number): UINode | null {
    if (!this.visible) return null;

    // 转换为本地坐标
    const lx = wx - this.x;
    const ly = wy - this.y;

    // 反向遍历子节点（后添加的在上层）
    for (let i = this._children.length - 1; i >= 0; i--) {
      const hit = this._children[i].hitTest(lx, ly);
      if (hit) return hit;
    }

    // 检测自身
    if (this.interactive && this._containsLocal(lx, ly)) {
      return this;
    }

    return null;
  }

  /** 世界坐标转本地坐标 */
  worldToLocal(wx: number, wy: number): Point {
    const chain: UINode[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: UINode | null = this;
    while (node) {
      chain.push(node);
      node = node.$parent;
    }
    // 从根到自身依次减去偏移
    let lx = wx;
    let ly = wy;
    for (let i = chain.length - 1; i >= 0; i--) {
      lx -= chain[i].x;
      ly -= chain[i].y;
    }
    return { x: lx, y: ly };
  }

  /** 点是否在本地坐标范围内 */
  private _containsLocal(lx: number, ly: number): boolean {
    return lx >= 0 && lx <= this.width && ly >= 0 && ly <= this.height;
  }

  // ── 测试辅助 ────────────────────────────────

  get $text(): string | undefined { return undefined; }
  get $highlighted(): boolean | undefined { return undefined; }
  get $disabled(): boolean | undefined { return undefined; }
}
