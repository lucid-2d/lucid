/**
 * Keyboard input — key state tracking for PC games.
 *
 * ```typescript
 * const kb = new Keyboard();
 * kb.bind(document);
 *
 * // In update loop:
 * if (kb.isDown('ArrowLeft')) player.x -= speed * dt;
 * if (kb.wasPressed('Space')) player.jump();
 * kb.update(); // call at end of frame to reset wasPressed/wasReleased
 * ```
 */

export class Keyboard {
  private _down = new Set<string>();
  private _pressed = new Set<string>();
  private _released = new Set<string>();
  private _onKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private _onKeyUp: ((e: KeyboardEvent) => void) | null = null;

  /** Bind keyboard events to a DOM element (usually document) */
  bind(target: any): void {
    this._onKeyDown = (e: KeyboardEvent) => {
      if (!this._down.has(e.key)) {
        this._pressed.add(e.key);
      }
      this._down.add(e.key);
    };

    this._onKeyUp = (e: KeyboardEvent) => {
      this._down.delete(e.key);
      this._released.add(e.key);
    };

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
  }

  /** Unbind keyboard events */
  unbind(target: any): void {
    if (this._onKeyDown) target.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) target.removeEventListener('keyup', this._onKeyUp);
    this._onKeyDown = null;
    this._onKeyUp = null;
  }

  /** Is a key currently held down? */
  isDown(key: string): boolean {
    return this._down.has(key);
  }

  /** Was a key pressed this frame? (true only on the frame it was first pressed) */
  wasPressed(key: string): boolean {
    return this._pressed.has(key);
  }

  /** Was a key released this frame? */
  wasReleased(key: string): boolean {
    return this._released.has(key);
  }

  /** All currently held keys */
  get downKeys(): ReadonlySet<string> {
    return this._down;
  }

  /** Call at the end of each frame to reset per-frame state */
  update(): void {
    this._pressed.clear();
    this._released.clear();
  }

  /** Reset all state */
  reset(): void {
    this._down.clear();
    this._pressed.clear();
    this._released.clear();
  }

  /** Simulate a key press (for testing) */
  simulatePress(key: string): void {
    if (!this._down.has(key)) {
      this._pressed.add(key);
    }
    this._down.add(key);
  }

  /** Simulate a key release (for testing) */
  simulateRelease(key: string): void {
    this._down.delete(key);
    this._released.add(key);
  }
}
