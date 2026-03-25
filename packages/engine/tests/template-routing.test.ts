/**
 * Template routing validation — non-template scenes are rejected by router.
 */
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

// Create an app with template enforcement enabled (simulates boot())
function makeEnforcedApp() {
  const mockCanvas = {
    width: 390, height: 844,
    getContext: () => ({
      save: () => {}, restore: () => {},
      fillRect: () => {}, clearRect: () => {},
      fillText: () => {}, measureText: () => ({ width: 0 }),
      beginPath: () => {}, arc: () => {}, fill: () => {},
      translate: () => {}, scale: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      set font(_: string) {},
      set fillStyle(_: string) {},
      set textAlign(_: string) {},
      set textBaseline(_: string) {},
      set globalAlpha(_: number) {},
      set strokeStyle(_: string) {},
      set lineWidth(_: number) {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ width: 390, height: 844, left: 0, top: 0 }),
    style: {},
  };

  const app = createApp({ platform: 'web', canvas: mockCanvas as any });
  app.router._skipTemplateValidation = false; // simulate boot() behavior
  return app;
}

// Fake template scene (has __template marker)
class FakeTemplateScene extends SceneNode {
  static readonly __template = true;
  constructor() {
    super({ id: 'fake-template', width: 390, height: 844 });
  }
}

describe('template routing enforcement', () => {
  it('rejects raw SceneNode on push', () => {
    const app = makeEnforcedApp();
    const scene = new SceneNode({ id: 'raw', width: 390, height: 844 });

    expect(() => app.router.push(scene)).toThrow('not a template scene');
  });

  it('rejects raw SceneNode on replace', () => {
    const app = makeEnforcedApp();
    const scene = new SceneNode({ id: 'raw', width: 390, height: 844 });

    expect(() => app.router.replace(scene)).toThrow('not a template scene');
  });

  it('accepts scenes with __template marker', () => {
    const app = makeEnforcedApp();
    const scene = new FakeTemplateScene();

    expect(() => app.router.push(scene)).not.toThrow();
  });

  it('error message suggests createScene', () => {
    const app = makeEnforcedApp();
    const scene = new SceneNode({ id: 'my-scene', width: 390, height: 844 });

    try {
      app.router.push(scene);
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toContain('createScene()');
      expect(e.message).toContain('my-scene');
    }
  });
});
