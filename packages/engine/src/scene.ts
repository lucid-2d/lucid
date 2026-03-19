/**
 * SceneNode + SceneRouter — 场景即路由即 UINode
 *
 * 场景是特殊的 UINode：
 * - 有 onEnter/onExit/onPause/onResume 生命周期
 * - 由 SceneRouter 管理（push/pop/replace）
 * - SceneRouter 自身也是 UINode（场景作为子节点）
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

/**
 * SceneRouter — 场景栈管理器，本身是 UINode
 *
 * 类似 SPA 路由：push = 打开新页面，pop = 返回，replace = 替换当前
 * 场景作为 Router 的子节点，天然参与 $render / $update / $inspect
 */
export class SceneRouter extends UINode {
  private stack: SceneNode[] = [];

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

  /** 压入新场景（暂停当前，进入新场景） */
  push(scene: SceneNode): void {
    this.current?.onPause();
    this.stack.push(scene);
    this.addChild(scene);
    scene.onEnter();
  }

  /** 弹出栈顶场景（退出当前，恢复前一个） */
  pop(): SceneNode | undefined {
    if (this.stack.length === 0) return undefined;

    const scene = this.stack.pop()!;
    scene.onExit();
    this.removeChild(scene);
    this.current?.onResume();
    return scene;
  }

  /** 替换栈顶场景 */
  replace(scene: SceneNode): void {
    const prev = this.stack.pop();
    if (prev) {
      prev.onExit();
      this.removeChild(prev);
    }
    this.stack.push(scene);
    this.addChild(scene);
    scene.onEnter();
  }
}
