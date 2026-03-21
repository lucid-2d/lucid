/**
 * @lucid/core — AI-first Canvas 2D 游戏 UI 组件库
 */

// 核心
export { UINode, type UINodeOptions, type AnimateOptions, type Animation, type NodeSnapshot, type PropChange } from './node.js';
export { EventEmitter } from './events.js';
export { type EasingName, type EasingFn, resolveEasing } from './easing.js';
export { type Rect, type Point } from './types.js';
export { computeLayout, type LayoutDirection, type LayoutAlign, type LayoutJustify, type Padding } from './layout.js';

// 精灵
export { Sprite, SpriteSheet, AnimatedSprite, type SpriteProps, type SourceRect, type SpriteSheetRegions, type AnimatedSpriteProps, type FrameDef, type PlayMode } from './sprite.js';

// 工具
export { Timer, CountdownTimer, type CountdownOptions } from './timer.js';
export { SeededRNG } from './rng.js';

// 摄像机
export { Camera, type CameraOptions, type FollowOptions } from './camera.js';

// 文本
export { wrapText, measureWrappedText, drawText, type TextMetrics, type DrawTextOptions } from './text.js';

// AI 调试
export { InteractionRecorder, type InteractionRecord, type RecorderOptions } from './recorder.js';
