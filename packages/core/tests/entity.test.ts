import { describe, it, expect } from 'vitest';
import { Entity, UINode } from '../src/index';

// Plain game object — no framework dependency
class Ship {
  x = 100;
  y = 200;
  speed = 5;
  angle = 45;
  state: 'orbiting' | 'flying' = 'orbiting';
}

class Planet {
  x = 300;
  y = 400;
  radius = 60;
  name = 'Alpha';
}

describe('Entity', () => {
  it('creates from a plain object', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y', 'speed'] });
    expect(entity.id).toBe('ship');
    expect(entity.source).toBe(ship);
  });

  it('$type defaults to source constructor name', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship' });
    expect(entity.$type).toBe('Ship');
  });

  it('$type can be overridden', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', type: 'PlayerShip' });
    expect(entity.$type).toBe('PlayerShip');
  });

  it('$inspect shows source properties', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'player', props: ['x', 'y', 'state'] });
    const out = entity.$inspect();
    expect(out).toContain('Ship#player');
    expect(out).toContain('x=100');
    expect(out).toContain('y=200');
    expect(out).toContain('state=orbiting');
  });

  it('$inspect reflects live state changes', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 's', props: ['x', 'state'] });

    ship.x = 999;
    ship.state = 'flying';

    const out = entity.$inspect();
    expect(out).toContain('x=999');
    expect(out).toContain('state=flying');
  });

  it('$inspect with custom inspect function', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, {
      id: 'ship',
      inspect: () => `pos=(${ship.x},${ship.y}) spd=${ship.speed}`,
    });
    expect(entity.$inspect()).toContain('pos=(100,200) spd=5');
  });

  it('$patch modifies source properties', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y', 'angle'] });

    entity.$patch({ x: 500, angle: 90 });
    expect(ship.x).toBe(500);
    expect(ship.angle).toBe(90);
    expect(ship.y).toBe(200); // unchanged
  });

  it('$patch ignores non-exposed properties', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y'] });

    entity.$patch({ speed: 999 });
    expect(ship.speed).toBe(5); // unchanged — not in props
  });

  it('$query finds entity by type', () => {
    const root = new UINode({ id: 'root', width: 390, height: 844 });
    const ship = new Ship();
    root.addChild(Entity.from(ship, { id: 'ship', props: ['x', 'y'] }));

    const found = root.$query('Ship');
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe('ship');
  });

  it('$query finds entity by id', () => {
    const root = new UINode({ id: 'root' });
    root.addChild(Entity.from(new Ship(), { id: 'player-ship' }));
    root.addChild(Entity.from(new Ship(), { id: 'enemy-ship' }));

    const found = root.$query('#player-ship');
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe('player-ship');
  });

  it('$query finds entity by custom type', () => {
    const root = new UINode({ id: 'root' });
    root.addChild(Entity.from(new Ship(), { id: 's1', type: 'PlayerShip' }));
    root.addChild(Entity.from(new Ship(), { id: 's2', type: 'EnemyShip' }));

    expect(root.$query('PlayerShip')).toHaveLength(1);
    expect(root.$query('EnemyShip')).toHaveLength(1);
    expect(root.$query('Ship')).toHaveLength(0); // overridden
  });

  it('appears in parent $inspect tree', () => {
    const root = new UINode({ id: 'game', width: 390, height: 844 });
    root.addChild(Entity.from(new Ship(), { id: 'ship', props: ['x', 'y'] }));
    root.addChild(Entity.from(new Planet(), { id: 'planet', props: ['x', 'y', 'radius'] }));

    const tree = root.$inspect();
    expect(tree).toContain('Ship#ship');
    expect(tree).toContain('Planet#planet');
    expect(tree).toContain('radius=60');
  });

  it('multiple entities coexist with UINodes', () => {
    const root = new UINode({ id: 'root' });
    const btn = new UINode({ id: 'btn', width: 100, height: 40, interactive: true });
    root.addChild(btn);
    root.addChild(Entity.from(new Ship(), { id: 'ship', props: ['x'] }));

    const tree = root.$inspect();
    expect(tree).toContain('UINode#btn');
    expect(tree).toContain('Ship#ship');

    // $query works for both
    expect(root.$query('UINode')).toHaveLength(1); // btn (root is also UINode but query is descendant)
    expect(root.$query('Ship')).toHaveLength(1);
  });

  it('$snapshot includes source properties', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y', 'speed'] });
    const snap = entity.$snapshot();

    expect(snap.type).toBe('Ship');
    expect((snap as any).x).toBe(100);
    expect((snap as any).y).toBe(200);
    expect((snap as any).speed).toBe(5);
  });

  it('zero rendering cost — draw is noop', () => {
    const entity = Entity.from(new Ship(), { id: 'ship' });
    // draw() should not throw
    const ctx = {} as any;
    entity.$render(ctx); // should be safe
  });

  it('source setter swaps the proxied object', () => {
    const ball1 = { x: 10, y: 20, color: 'red' };
    const ball2 = { x: 30, y: 40, color: 'blue' };
    const entity = Entity.from(ball1, { id: 'ball', type: 'Ball', props: ['x', 'y', 'color'] });

    expect(entity.$inspect()).toContain('x=10');
    expect(entity.$inspect()).toContain('color=red');

    entity.source = ball2;
    expect(entity.$inspect()).toContain('x=30');
    expect(entity.$inspect()).toContain('color=blue');
    expect(entity.$type).toBe('Ball'); // custom type preserved
  });

  it('source setter with null shows (empty)', () => {
    const entity = Entity.from({ x: 1 }, { id: 'e', type: 'Ball', props: ['x'] });
    entity.source = null;
    expect(entity.$inspect()).toContain('(empty)');
  });

  it('source setter without custom type updates type from new source', () => {
    class Bullet { x = 0; }
    class Missile { x = 0; }
    const entity = Entity.from(new Bullet(), { id: 'proj', props: ['x'] });
    expect(entity.$type).toBe('Bullet');

    entity.source = new Missile();
    expect(entity.$type).toBe('Missile');
  });

  it('pooling pattern: reuse entities via source + visible', () => {
    const root = new UINode({ id: 'root' });
    const pool = Array.from({ length: 5 }, (_, i) =>
      Entity.from(null, { id: `ball-${i}`, type: 'Ball', props: ['x', 'y'] })
    );
    pool.forEach(e => { e.visible = false; root.addChild(e); });

    // Activate 3 balls
    const balls = [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }];
    balls.forEach((b, i) => { pool[i].source = b; pool[i].visible = true; });

    // $query returns all (including hidden), filter visible manually
    expect(root.$query('Ball').length).toBe(5);
    expect(root.$query('Ball').filter(e => e.visible).length).toBe(3);
    // Active ones show state, inactive ones show hidden
    expect(root.$inspect()).toContain('Ball#ball-0 x=10');
    expect(root.$inspect()).toContain('Ball#ball-3 hidden');

    // Ball destroyed: just hide
    pool[1].visible = false;
    expect(root.$query('Ball').filter(e => e.visible).length).toBe(2);
  });

  it('nested entities (e.g. ship with child components)', () => {
    const root = new UINode({ id: 'root' });
    const shipObj = new Ship();
    const shipEntity = Entity.from(shipObj, { id: 'ship', props: ['x', 'y'] });

    const shield = { active: true, hp: 50 };
    shipEntity.addChild(Entity.from(shield, { id: 'shield', type: 'Shield', props: ['active', 'hp'] }));

    root.addChild(shipEntity);

    const tree = root.$inspect();
    expect(tree).toContain('Ship#ship');
    expect(tree).toContain('Shield#shield');
    expect(tree).toContain('hp=50');

    expect(root.$query('Shield')).toHaveLength(1);
  });
});

// ── $restore ──

describe('Entity $restore', () => {
  it('restores source properties from snapshot', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y', 'speed', 'angle', 'state'] });

    const snap = entity.$snapshot();
    ship.x = 999; ship.y = 888; ship.speed = 0; ship.state = 'flying';

    entity.$restore(snap);
    expect(ship.x).toBe(100);
    expect(ship.y).toBe(200);
    expect(ship.speed).toBe(5);
    expect(ship.state).toBe('orbiting');
  });

  it('restores UINode structural props too', () => {
    const obj = { hp: 100 };
    const entity = Entity.from(obj, { id: 'unit', props: ['hp'] });
    entity.alpha = 0.5; entity.visible = false;

    const snap = entity.$snapshot();
    entity.alpha = 0.1; entity.visible = true;

    entity.$restore(snap);
    expect(entity.alpha).toBe(0.5);
    expect(entity.visible).toBe(false);
    expect(obj.hp).toBe(100); // source prop also restored
  });

  it('ignores non-exposed properties in snapshot', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y'] });
    const snap = entity.$snapshot();
    // Manually inject extra property
    (snap as any).speed = 999;

    entity.$restore(snap);
    // speed is NOT in _props, so it should NOT be restored
    expect(ship.speed).toBe(5); // original value
  });

  it('does not throw with null source', () => {
    const ship = new Ship();
    const entity = Entity.from(ship, { id: 'ship', props: ['x', 'y'] });
    const snap = entity.$snapshot();

    entity.source = null as any;
    expect(() => entity.$restore(snap)).not.toThrow();
  });

  it('round-trip: snapshot → simulate → restore (OracleBot pattern)', () => {
    const chain = { length: 25, speed: 20, pushing: true, frozen: false, totalRemoved: 0 };
    const entity = Entity.from(chain, {
      id: 'chain',
      type: 'Chain',
      props: ['length', 'speed', 'pushing', 'frozen', 'totalRemoved'],
    });

    const saved = entity.$snapshot();

    // Simulate: chain shrinks, speeds up, removes balls
    chain.length = 18;
    chain.speed = 25;
    chain.pushing = false;
    chain.totalRemoved = 7;

    // Restore
    entity.$restore(saved);
    expect(chain.length).toBe(25);
    expect(chain.speed).toBe(20);
    expect(chain.pushing).toBe(true);
    expect(chain.frozen).toBe(false);
    expect(chain.totalRemoved).toBe(0);
  });
});
