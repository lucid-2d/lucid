import { describe, it, expect } from 'vitest';
import { Keyboard } from '../src/keyboard';

describe('Keyboard', () => {
  it('simulatePress marks key as down and pressed', () => {
    const kb = new Keyboard();
    kb.simulatePress('ArrowLeft');
    expect(kb.isDown('ArrowLeft')).toBe(true);
    expect(kb.wasPressed('ArrowLeft')).toBe(true);
  });

  it('wasPressed is true only for one frame', () => {
    const kb = new Keyboard();
    kb.simulatePress('Space');
    expect(kb.wasPressed('Space')).toBe(true);

    kb.update(); // end of frame
    expect(kb.wasPressed('Space')).toBe(false);
    expect(kb.isDown('Space')).toBe(true); // still held
  });

  it('simulateRelease marks key as released', () => {
    const kb = new Keyboard();
    kb.simulatePress('Space');
    kb.update();

    kb.simulateRelease('Space');
    expect(kb.isDown('Space')).toBe(false);
    expect(kb.wasReleased('Space')).toBe(true);

    kb.update();
    expect(kb.wasReleased('Space')).toBe(false);
  });

  it('isDown is false for keys never pressed', () => {
    const kb = new Keyboard();
    expect(kb.isDown('x')).toBe(false);
    expect(kb.wasPressed('x')).toBe(false);
  });

  it('holding a key does not re-trigger wasPressed', () => {
    const kb = new Keyboard();
    kb.simulatePress('a');
    kb.update();
    // Simulate holding (press again without release)
    kb.simulatePress('a');
    expect(kb.wasPressed('a')).toBe(false); // already down
    expect(kb.isDown('a')).toBe(true);
  });

  it('multiple keys tracked independently', () => {
    const kb = new Keyboard();
    kb.simulatePress('a');
    kb.simulatePress('b');
    expect(kb.isDown('a')).toBe(true);
    expect(kb.isDown('b')).toBe(true);

    kb.simulateRelease('a');
    expect(kb.isDown('a')).toBe(false);
    expect(kb.isDown('b')).toBe(true);
  });

  it('downKeys returns all held keys', () => {
    const kb = new Keyboard();
    kb.simulatePress('w');
    kb.simulatePress('a');
    const keys = [...kb.downKeys];
    expect(keys).toContain('w');
    expect(keys).toContain('a');
  });

  it('reset clears all state', () => {
    const kb = new Keyboard();
    kb.simulatePress('x');
    kb.reset();
    expect(kb.isDown('x')).toBe(false);
    expect(kb.wasPressed('x')).toBe(false);
  });
});
