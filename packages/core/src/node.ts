/**
 * UINode — Canvas 世界的 "DOM 节点"
 *
 * 提供：树结构、坐标变换、hitTest、脏标记、事件、生命周期
 */

import { EventEmitter } from './events.js';
import { resolveEasing } from './easing.js';
import type { EasingName, EasingFn } from './easing.js';
import type { Point } from './types.js';
import { computeLayout, type LayoutDirection, type LayoutAlign, type LayoutJustify, type Padding } from './layout.js';

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
  // Layout container
  layout?: LayoutDirection;
  gap?: number;
  padding?: Padding;
  alignItems?: LayoutAlign;
  justifyContent?: LayoutJustify;
  wrap?: boolean;
  columns?: number;
  // Layout child
  flex?: number;
  alignSelf?: LayoutAlign;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface NodeSnapshot {
  type: string;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  interactive: boolean;
  alpha: number;
  text?: string;
  info?: string;
  children?: NodeSnapshot[];
}

export interface PropChange {
  path: string;
  prop: string;
  from: any;
  to: any;
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

  // Layout container properties
  layout?: LayoutDirection;
  gap?: number;
  padding?: Padding;
  alignItems?: LayoutAlign;
  justifyContent?: LayoutJustify;
  wrap?: boolean;
  columns?: number;

  // Layout child properties
  flex?: number;
  alignSelf?: LayoutAlign;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  protected _dirty = true;
  private _animations: ActiveAnimation[] = [];

  constructor(opts?: UINodeOptions) {
    super();
    this.id = opts?.id ?? '';
    this.x = opts?.x ?? 0;
    this.y = opts?.y ?? 0;
    this.width = opts?.width ?? 0;
    this.height = opts?.height ?? 0;
    // Layout
    if (opts?.layout) this.layout = opts.layout;
    if (opts?.gap !== undefined) this.gap = opts.gap;
    if (opts?.padding !== undefined) this.padding = opts.padding;
    if (opts?.alignItems) this.alignItems = opts.alignItems;
    if (opts?.justifyContent) this.justifyContent = opts.justifyContent;
    if (opts?.wrap) this.wrap = opts.wrap;
    if (opts?.columns !== undefined) this.columns = opts.columns;
    if (opts?.flex !== undefined) this.flex = opts.flex;
    if (opts?.alignSelf) this.alignSelf = opts.alignSelf;
    if (opts?.minWidth !== undefined) this.minWidth = opts.minWidth;
    if (opts?.maxWidth !== undefined) this.maxWidth = opts.maxWidth;
    if (opts?.minHeight !== undefined) this.minHeight = opts.minHeight;
    if (opts?.maxHeight !== undefined) this.maxHeight = opts.maxHeight;
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

  /**
   * CSS-like query within this subtree.
   *
   * Selectors:
   *   '#id'          — match by id
   *   'ClassName'    — match by constructor name
   *   '.interactive' — match interactive nodes
   *   '.visible'     — match visible nodes (default all are visible)
   *   '.hidden'      — match hidden nodes
   *   'A B'          — B descendant of A
   *
   * ```typescript
   * root.$query('Button');              // all Buttons
   * root.$query('#play');               // node with id 'play'
   * root.$query('.interactive');        // all interactive nodes
   * root.$query('MenuScene Button');    // Buttons inside MenuScene
   * ```
   */
  $query(selector: string): UINode[] {
    const parts = selector.trim().split(/\s+/);
    if (parts.length === 1) {
      return this._querySimple(parts[0]);
    }
    // Descendant chain: first selector narrows scope, then search within results
    let candidates: UINode[] = this._querySimple(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      const next: UINode[] = [];
      for (const c of candidates) {
        next.push(...c._querySimple(parts[i]));
      }
      candidates = next;
    }
    return candidates;
  }

  private _querySimple(sel: string): UINode[] {
    const results: UINode[] = [];
    this._collectQuery(sel, results);
    return results;
  }

  private _collectQuery(sel: string, results: UINode[]): void {
    for (const child of this._children) {
      if (_matchSelector(child, sel)) results.push(child);
      child._collectQuery(sel, results);
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

    // Auto-layout: compute children positions before rendering
    if (this.layout) {
      computeLayout(this);
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

  // ── AI 调试 ──────────────────────────────────

  /**
   * Batch-update properties. AI agent can call this at runtime
   * to tweak node without editing source code.
   *
   * ```typescript
   * node.$patch({ x: 100, width: 200, visible: false });
   * ```
   */
  $patch(props: Record<string, any>): this {
    for (const [key, value] of Object.entries(props)) {
      if (key in this) {
        (this as any)[key] = value;
      }
    }
    this._dirty = true;
    return this;
  }

  get $text(): string | undefined { return undefined; }
  get $highlighted(): boolean | undefined { return undefined; }
  get $disabled(): boolean | undefined { return undefined; }

  /** Override to append extra state info to $inspect output line */
  protected $inspectInfo(): string { return ''; }

  /**
   * Capture a structured snapshot of this subtree for diffing.
   *
   * ```typescript
   * const before = root.$snapshot();
   * // ... make changes ...
   * const after = root.$snapshot();
   * const changes = UINode.$diff(before, after);
   * ```
   */
  $snapshot(): NodeSnapshot {
    const snap: NodeSnapshot = {
      type: this.constructor.name,
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      visible: this.visible,
      interactive: this.interactive,
      alpha: this.alpha,
    };
    const text = this.$text;
    if (text !== undefined) snap.text = text;
    const extra = this.$inspectInfo();
    if (extra) snap.info = extra;
    if (this._children.length > 0) {
      snap.children = this._children.map(c => c.$snapshot());
    }
    return snap;
  }

  /**
   * Compare two snapshots, return property-level changes.
   *
   * ```typescript
   * const changes = UINode.$diff(before, after);
   * // [{ path: 'menu > play', prop: 'x', from: 0, to: 100 }]
   * ```
   */
  static $diff(before: NodeSnapshot, after: NodeSnapshot, parentPath = ''): PropChange[] {
    const changes: PropChange[] = [];
    const path = parentPath ? `${parentPath} > ${before.id || before.type}` : (before.id || before.type);

    // Compare scalar props
    const keys: (keyof NodeSnapshot)[] = ['x', 'y', 'width', 'height', 'visible', 'interactive', 'alpha', 'text', 'info'];
    for (const key of keys) {
      if (before[key] !== after[key]) {
        changes.push({ path, prop: key, from: before[key], to: after[key] });
      }
    }

    // Compare children
    const bChildren = before.children ?? [];
    const aChildren = after.children ?? [];
    const maxLen = Math.max(bChildren.length, aChildren.length);

    for (let i = 0; i < maxLen; i++) {
      if (i >= bChildren.length) {
        const added = aChildren[i];
        changes.push({ path, prop: 'children', from: undefined, to: `+${added.type}#${added.id}` });
      } else if (i >= aChildren.length) {
        const removed = bChildren[i];
        changes.push({ path, prop: 'children', from: `${removed.type}#${removed.id}`, to: undefined });
      } else {
        changes.push(...UINode.$diff(bChildren[i], aChildren[i], path));
      }
    }

    return changes;
  }

  /**
   * 输出结构化文本描述，供 AI 读取。
   * @param depth 递归深度，默认无限。0 = 仅自身。
   */
  $inspect(depth?: number): string {
    return this._inspectLine(0, depth ?? Infinity);
  }

  private _inspectLine(indent: number, depthLeft: number): string {
    const pad = '  '.repeat(indent);
    const parts: string[] = [];

    // 类名#id
    const className = this.constructor.name;
    parts.push(this.id ? `${className}#${this.id}` : className);

    // 尺寸
    if (this.width > 0 || this.height > 0) {
      parts.push(`(${this.width}x${this.height})`);
    }

    // 位置
    if (this.x !== 0 || this.y !== 0) {
      parts.push(`at(${this.x},${this.y})`);
    }

    // 文字
    const text = this.$text;
    if (text !== undefined) {
      parts.push(`"${text}"`);
    }

    // 状态
    if (!this.visible) parts.push('hidden');
    if (this.$disabled) parts.push('disabled');
    if (this.$highlighted) parts.push('highlighted');

    // 子类扩展信息
    const extra = this.$inspectInfo();
    if (extra) parts.push(extra);

    let line = pad + parts.join(' ');

    // 子节点
    if (depthLeft > 0) {
      for (const child of this._children) {
        line += '\n' + child._inspectLine(indent + 1, depthLeft - 1);
      }
    }

    return line;
  }

  /**
   * 获取从根到自身的节点路径。
   * 输出如 "root > panel > btn"
   */
  $path(): string {
    const chain: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: UINode | null = this;
    while (node) {
      chain.push(node.id || node.constructor.name);
      node = node.$parent;
    }
    return chain.reverse().join(' > ');
  }
}

// ── selector matching ──

function _matchSelector(node: UINode, sel: string): boolean {
  if (sel.startsWith('#')) {
    return node.id === sel.slice(1);
  }
  if (sel === '.interactive') {
    return node.interactive;
  }
  if (sel === '.hidden') {
    return !node.visible;
  }
  if (sel === '.visible') {
    return node.visible;
  }
  // Class name match
  return node.constructor.name === sel;
}
