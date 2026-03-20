# Lucid — AI-first Canvas 2D Game Framework

## What this is

Lucid is a Canvas 2D game framework designed for AI agents to build, inspect, debug, and test games. Every UI element is a `UINode` — a tree node that supports `$inspect()` for state snapshots, interaction recording, and deterministic replay.

## Repository structure

```
packages/
  core/      — UINode, events, animation, Timer, SeededRNG, InteractionRecorder
  engine/    — createApp, SceneRouter, platform adapters (Web/Wx/Tt)
  ui/        — 11 base components (Button, Label, Modal, Toggle, TabBar, ScrollView, ...)
  game-ui/   — 9 business components (CheckinDialog, ShopPanel, SettingsPanel, ...)
  physics/   — Vec2, collision detection, particles, screen shake
  systems/   — 10 operation systems (Storage, Checkin, Skin, Achievement, Mission, ...)
playground/  — Visual component gallery (vite dev server)
```

## Commands

```bash
pnpm install                    # install dependencies
pnpm -r test                    # run all 347 tests
pnpm -r build                   # build all packages
npx vite --config playground/vite.config.ts --port 3456  # run playground
```

## Architecture

### Core concept: UINode tree

All visible elements extend `UINode`. The tree is the single source of truth for:
- **Rendering**: `$render(ctx)` traverses the tree, calls `draw(ctx)` per node
- **Hit testing**: `hitTest(x, y)` finds the deepest interactive node at a point
- **AI inspection**: `$inspect()` returns a text snapshot of the entire tree
- **Recording**: `InteractionRecorder` logs every touch event with node paths
- **Replay**: `app.replay(records, speed)` replays recorded interactions deterministically

### Package dependency graph

```
core (zero deps)
  ← engine (core)
  ← ui (core)
  ← physics (zero deps)
  ← game-ui (core, ui)
  ← systems (zero deps)
```

### Platform support

| Platform | Adapter | Storage | Status |
|----------|---------|---------|--------|
| Web browser | WebAdapter | WebStorage (localStorage) | verified |
| WeChat Mini Game | WxAdapter | MiniGameStorage (wx API) | implemented + tested |
| Douyin Mini Game | TtAdapter | MiniGameStorage (tt API) | implemented + tested |

## Key patterns

### Creating an app

```typescript
import { createApp } from '@lucid/engine';

const app = createApp({ platform: 'web', canvas, debug: true });
app.router.push(new MyScene(app));
app.start();
```

### Creating a scene

```typescript
import { SceneNode, type App } from '@lucid/engine';
import { Button, Label, UIColors } from '@lucid/ui';

class MenuScene extends SceneNode {
  constructor(private app: App) { super({ id: 'menu' }); }

  onEnter() {
    const btn = new Button({ id: 'play', text: 'Start', variant: 'primary', width: 200, height: 50 });
    btn.x = 95; btn.y = 400;
    btn.$on('tap', () => this.app.router.replace(new GameScene(this.app)));
    this.addChild(btn);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = UIColors.bgTop;
    ctx.fillRect(0, 0, 390, 844);
  }
}
```

### Custom UINode

```typescript
import { UINode } from '@lucid/core';

class HealthBar extends UINode {
  value = 1; // 0..1

  constructor() {
    super({ id: 'health', width: 200, height: 20 });
  }

  get $text() { return `${Math.round(this.value * 100)}%`; }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.value > 0.3 ? '#4caf50' : '#f44336';
    ctx.fillRect(0, 0, this.width * this.value, this.height);
  }
}
```

### AI inspection

```typescript
// from browser console or Playwright
const app = window._app;
console.log(app.root.$inspect());
// Output:
// UINode#root (390x844)
//   SceneRouter#router
//     MenuScene#menu
//       Label#title (390x50) "My Game"
//       Button#play (200x50) at(95,400) "Start"

// find and interact
const btn = app.root.findById('play');
btn.$emit('tap');
```

### Recording and replay

```typescript
// dump recorded interactions
const records = app.dumpInteractions();
// replay at 2x speed
await app.replay(records, 2);
```

### Using operation systems

```typescript
import { createStorage, CheckinSystem, SkinSystem } from '@lucid/systems';
import { CheckinDialog } from '@lucid/game-ui';

const storage = createStorage('myapp:');
const checkin = new CheckinSystem({ storage, rewards: [10, 15, 20, 25, 30, 40, 80] });

const state = checkin.getState();
const dialog = new CheckinDialog({ rewards: state.rewards, currentDay: state.currentDay, claimed: state.claimed });
dialog.$on('claim', () => { const reward = checkin.claim(); });
scene.addChild(dialog);
```

## Test conventions

- Framework: vitest
- Pattern: `packages/*/tests/*.test.ts`
- All tests are deterministic (SeededRNG, no timers)
- Run single package: `cd packages/core && npx vitest run`

## Commit conventions

- `feat:` new features
- `fix:` bug fixes
- `chore:` build/config changes
- Chinese commit messages are acceptable
