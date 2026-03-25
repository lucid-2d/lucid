/**
 * SceneNode — UINode with scene lifecycle hooks.
 *
 * Managed by SceneRouter (push/pop/replace).
 * Lives in core so that game-ui can extend it without depending on engine.
 */

import { UINode, type UINodeOptions } from './node.js';

export interface ScenePreset<T extends SceneNode = SceneNode> {
  /** Human-readable description (shown in $inspect) */
  label?: string;
  /** Setup function — mutate the scene to reach this state */
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
   * Async resource loading hook. Called before onEnter().
   * Override to load images, audio, or data files.
   */
  preload(): Promise<void> | void {}

  /**
   * Declare preset states for AI inspection, testing, and screenshots.
   */
  $presets(): Record<string, ScenePreset<this>> | null {
    return null;
  }

  constructor(opts?: UINodeOptions) {
    super(opts);
  }
}
