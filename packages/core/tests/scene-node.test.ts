import { describe, it, expect, vi } from 'vitest';
import { SceneNode } from '../src/scene-node';
import { UINode } from '../src/node.js';

describe('SceneNode', () => {
  it('extends UINode with default dimensions', () => {
    const scene = new SceneNode({ id: 'test', width: 390, height: 844 });
    expect(scene.id).toBe('test');
    expect(scene.width).toBe(390);
    expect(scene.height).toBe(844);
  });

  it('works without options', () => {
    const scene = new SceneNode();
    expect(scene).toBeDefined();
  });

  it('lifecycle hooks are callable and do nothing by default', () => {
    const scene = new SceneNode();
    // Should not throw
    scene.onEnter();
    scene.onExit();
    scene.onPause();
    scene.onResume();
  });

  it('preload returns void by default', () => {
    const scene = new SceneNode();
    const result = scene.preload();
    expect(result).toBeUndefined();
  });

  it('preload can return a promise', async () => {
    class AsyncScene extends SceneNode {
      loaded = false;
      async preload() {
        this.loaded = true;
      }
    }
    const scene = new AsyncScene();
    await scene.preload();
    expect(scene.loaded).toBe(true);
  });

  it('$presets returns null by default', () => {
    const scene = new SceneNode();
    expect(scene.$presets()).toBeNull();
  });

  it('$presets can be overridden to return presets', () => {
    class GameScene extends SceneNode {
      paused = false;
      $presets() {
        return {
          normal: { label: 'Normal', setup: () => {} },
          paused: { label: 'Paused', setup: (s: GameScene) => { s.paused = true; } },
        };
      }
    }
    const scene = new GameScene();
    const presets = scene.$presets()!;
    expect(Object.keys(presets)).toEqual(['normal', 'paused']);
    expect(presets.paused.label).toBe('Paused');

    presets.paused.setup(scene);
    expect(scene.paused).toBe(true);
  });

  it('lifecycle hooks can be overridden', () => {
    const calls: string[] = [];
    class TrackingScene extends SceneNode {
      onEnter() { calls.push('enter'); }
      onExit() { calls.push('exit'); }
      onPause() { calls.push('pause'); }
      onResume() { calls.push('resume'); }
    }
    const scene = new TrackingScene();
    scene.onEnter();
    scene.onPause();
    scene.onResume();
    scene.onExit();
    expect(calls).toEqual(['enter', 'pause', 'resume', 'exit']);
  });

  it('can addChild like UINode', () => {
    const scene = new SceneNode({ id: 'root', width: 100, height: 100 });
    const child = new UINode({ id: 'child', width: 50, height: 50 });
    scene.addChild(child);
    expect(scene.findById('child')).toBe(child);
  });
});
