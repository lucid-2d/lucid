import { describe, it, expect } from 'vitest';
import { createTestApp } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

class SimplePhysicsScene extends SceneNode {
  private ball = { x: 195, y: 100, vx: 0, vy: 0 };
  
  constructor(private seed: number) {
    super({ id: 'game', width: 390, height: 844 });
  }

  onEnter() {
    // Use rng from app for initial velocity
    this.ball.vx = 50;
    this.ball.vy = 0;
  }

  $fixedUpdate(dt: number) {
    // Simple gravity + bounce physics
    this.ball.vy += 200 * dt; // gravity
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    
    // Bounce off walls
    if (this.ball.x < 0 || this.ball.x > 390) {
      this.ball.vx *= -0.9;
      this.ball.x = Math.max(0, Math.min(390, this.ball.x));
    }
    if (this.ball.y > 844) {
      this.ball.vy *= -0.8;
      this.ball.y = 844;
    }
  }

  protected $inspectInfo() {
    return `ball=(${Math.round(this.ball.x)},${Math.round(this.ball.y)}) vx=${Math.round(this.ball.vx)} vy=${Math.round(this.ball.vy)}`;
  }
}

describe('deterministic physics', () => {
  function runSim(seed: number, ticks: number) {
    const app = createTestApp({ rngSeed: seed, fixedTimestep: 1/60 });
    app.router.push(new SimplePhysicsScene(seed));
    app.tick(16); // onEnter
    for (let i = 0; i < ticks; i++) app.tick(16);
    return app.root.$inspect();
  }

  it('same seed + same ticks = identical state', () => {
    const result1 = runSim(42, 300);
    const result2 = runSim(42, 300);
    expect(result1).toBe(result2);
  });

  it('different tick counts = different state', () => {
    const result1 = runSim(42, 100);
    const result2 = runSim(42, 200);
    expect(result1).not.toBe(result2);
  });
});
