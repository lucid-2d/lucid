/**
 * Entity — AI-visible proxy for non-UINode game objects.
 *
 * Game objects (ships, planets, projectiles) don't need to be UINodes.
 * But AI agents need to see, query, and modify them. Entity bridges this gap:
 * it's a zero-rendering UINode that proxies $inspect/$query/$patch to any object.
 *
 * ```typescript
 * // Your game object — plain class, no framework dependency
 * class Ship {
 *   x = 100; y = 200; speed = 5; angle = 0;
 *   state: 'orbiting' | 'flying' = 'orbiting';
 * }
 *
 * // Register for AI visibility
 * const ship = new Ship();
 * scene.addChild(Entity.from(ship, {
 *   id: 'player-ship',
 *   props: ['x', 'y', 'speed', 'angle', 'state'],
 * }));
 *
 * // Now AI can:
 * app.root.$inspect();                    // → "Ship#player-ship x=100 y=200 speed=5 angle=0 state=orbiting"
 * app.root.$query('Ship');                // → [entity]
 * app.root.$query('#player-ship');        // → [entity]
 * app.root.findById('player-ship').$patch({ angle: 45 }); // → modifies ship.angle
 * ```
 */

import { UINode, type UINodeOptions } from './node.js';

export interface EntityDescriptor {
  /** Unique id for findById / $query('#id') */
  id: string;
  /** Type name for $inspect / $query('TypeName') (defaults to source constructor name) */
  type?: string;
  /** Property names to expose for $inspect and $patch */
  props?: string[];
  /** Custom inspect string (overrides auto-generated from props) */
  inspect?: () => string;
}

export class Entity extends UINode {
  private _source: any;
  private _entityType: string;
  private _customType: boolean;
  private _props: string[];
  private _customInspect?: () => string;

  constructor(source: any, desc: EntityDescriptor) {
    super({ id: desc.id });
    this._source = source;
    this._customType = !!desc.type;
    this._entityType = desc.type ?? source?.constructor?.name ?? 'Entity';
    this._props = desc.props ?? [];
    this._customInspect = desc.inspect;
  }

  /** The proxied game object */
  get source(): any { return this._source; }
  /** Swap the proxied object (for pooling — avoids addChild/removeChild) */
  set source(obj: any) {
    this._source = obj;
    if (obj && !this._customType) {
      this._entityType = obj.constructor?.name ?? 'Entity';
    }
  }

  /** Exposed property names */
  get props(): readonly string[] { return this._props; }

  // Override $type for $inspect/$query/$path
  get $type(): string { return this._entityType; }

  // Read property values from source for $inspect
  protected $inspectInfo(): string {
    if (!this._source) return '(empty)';
    if (this._customInspect) return this._customInspect();
    return this._props
      .map(p => {
        const v = this._source[p];
        if (typeof v === 'number') return `${p}=${Math.round(v * 100) / 100}`;
        return `${p}=${v}`;
      })
      .join(' ');
  }

  // Write properties to source via $patch
  $patch(props: Record<string, any>): this {
    if (this._source) {
      for (const [key, value] of Object.entries(props)) {
        if (this._props.includes(key)) {
          this._source[key] = value;
        }
      }
    }
    // Also handle UINode's own properties (x, y, visible, etc.)
    return super.$patch(props);
  }

  // Snapshot includes source properties
  $snapshot() {
    const snap = super.$snapshot();
    for (const p of this._props) {
      (snap as any)[p] = this._source[p];
    }
    return snap;
  }

  // Restore source properties + UINode structural props from snapshot
  $restore(snapshot: import('./node.js').NodeSnapshot): this {
    if (this._source) {
      for (const p of this._props) {
        if (p in snapshot) {
          this._source[p] = (snapshot as any)[p];
        }
      }
    }
    return super.$restore(snapshot);
  }

  // Zero rendering cost — skip all canvas operations
  protected draw(): void {}
  $render(ctx: CanvasRenderingContext2D): void {
    // Don't touch ctx at all — just render children (nested entities)
    for (const child of this.$children) {
      child.$render(ctx);
    }
  }

  /** Create an Entity proxy for a game object */
  static from(source: any, desc: EntityDescriptor): Entity {
    return new Entity(source, desc);
  }
}
