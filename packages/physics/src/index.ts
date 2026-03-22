/**
 * @lucid/physics — 向量、碰撞、粒子、屏幕震动
 */

export {
  type Vec2, vec2, add, sub, scale, negate,
  length, lengthSq, normalize, dot, cross,
  distance, distanceSq, angle, fromAngle, perp, lerp, reflect,
} from './vec2.js';

export {
  type CollisionResult,
  pointInRect, pointInCircle,
  circleRect, circleCircle, lineCircle,
} from './collision.js';

export { ScreenShake } from './screen-shake.js';
export { ParticlePool, ParticleEmitter, ParticlePresets, type Particle, type EmitOptions, type EmitterConfig, type ParticlePoolOptions } from './particles.js';
