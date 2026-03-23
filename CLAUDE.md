# Lucid — AI-first Canvas 2D Game Framework

**GitHub**: https://github.com/lucid-2d/lucid
**Packages**: `@lucid-2d/core`, `@lucid-2d/engine`, `@lucid-2d/ui`, `@lucid-2d/physics`, `@lucid-2d/game-ui`, `@lucid-2d/systems`

## What this is

Lucid is a Canvas 2D game framework designed for AI agents to build, inspect, debug, and test games. Every UI element is a `UINode` — a tree node that supports `$inspect()` for state snapshots, interaction recording, and deterministic replay. All rendering results are AI-queryable — line counts, truncation, button variants, scroll positions, particle states.

## Repository structure

```
packages/
  core/      — UINode, Entity, events, animation, Timer, SeededRNG, Sprite, AnimatedSprite, NineSlice, Camera, I18n, text utils
  engine/    — createApp (timeScale/fixedTimestep/debugPanel), SceneRouter (transitions+custom+hitTest隔离), platform adapters, headless rendering, audio (register), keyboard, asset loader, DebugPanel, test utils
  ui/        — 11 base components (Button, Label, Modal, Toggle, TabBar, ScrollView, ProgressBar(colorStops/label), ...)
  game-ui/   — 9 business components (CheckinDialog, ShopPanel, SettingsPanel, ...)
  physics/   — Vec2, collision, ParticlePool/Emitter/Presets, BezierPath, screen shake
  systems/   — 10 operation systems (Storage, Checkin, Skin, Achievement, Mission, ...)
playground/  — Visual component gallery (vite dev server)
templates/   — Game templates (starter, quiz)
```

## Commands

```bash
pnpm install                    # install dependencies
pnpm -r test                    # run all 598 tests
pnpm -r build                   # build all packages
npx vite --config playground/vite.config.ts --port 3456  # run playground
```

## Architecture

### Core concept: UINode tree

All visible elements extend `UINode`. The tree is the single source of truth for:
- **Rendering**: `$render(ctx)` traverses the tree, calls `draw(ctx)` per node
- **Hit testing**: `hitTest(x, y)` finds the deepest interactive node at a point
- **AI inspection**: `$inspect()` returns a text snapshot; `$inspectInfo()` hook for custom state
- **AI querying**: `$query('Button')`, `$query('#play')`, `$query('.interactive')`, `$query('Scene Button')`
- **AI diffing**: `$snapshot()` captures state, `UINode.$diff(before, after)` returns property changes
- **Runtime patching**: `$patch({ x: 100, width: 200 })` batch-modify properties
- **Recording**: `InteractionRecorder` logs every touch event with node paths
- **Replay**: `app.replay(records, speed)` replays recorded interactions deterministically
- **Layout**: Set `layout: 'row'|'column'` on any UINode to auto-position children (Flexbox subset + grid + wrap)
- **Debug overlay**: `app.debugOverlay = true` draws node borders, IDs, and touch areas on canvas

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
import { createApp } from '@lucid-2d/engine';

const app = createApp({ platform: 'web', canvas, debug: true });
app.timeScale = 1;  // 0=pause, 0.5=slow, 1=normal, 2=fast
app.router.push(new MyScene(app));
app.start();
```

### Creating a scene (with layout)

```typescript
import { SceneNode, type App } from '@lucid-2d/engine';
import { Button, Label, UIColors } from '@lucid-2d/ui';

class MenuScene extends SceneNode {
  constructor(private app: App) {
    super({ id: 'menu', width: 390, height: 844,
            layout: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 });
  }

  onEnter() {
    this.addChild(new Label({ text: 'My Game', fontSize: 40, width: 300, height: 50 }));
    const btn = new Button({ id: 'play', text: 'Start', variant: 'primary', width: 200, height: 50 });
    btn.$on('tap', () => this.app.router.replace(new GameScene(this.app)));
    this.addChild(btn);
    // No manual x/y — layout engine positions children automatically
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = UIColors.bgTop;
    ctx.fillRect(0, 0, 390, 844);
  }
}
```

### Custom UINode

```typescript
import { UINode } from '@lucid-2d/core';

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

### Headless rendering (no browser)

```typescript
import { createTestApp, tap } from '@lucid-2d/engine';

const app = createTestApp({ render: true }); // @napi-rs/canvas
app.router.push(new MenuScene(app));
app.tick(16);
app.saveImage('screenshot.png');

app.debugOverlay = true; // show node borders + IDs
app.tick(16);
app.saveImage('debug.png');
```

### AI query and diff

```typescript
// Query nodes
app.root.$query('Button');              // by class name
app.root.$query('#play');               // by id
app.root.$query('MenuScene Button');    // descendant
app.root.$query('.interactive');        // by state

// Runtime modification
app.root.findById('btn').$patch({ x: 100, width: 200 });

// Snapshot diffing
const before = app.root.$snapshot();
// ... make changes ...
const after = app.root.$snapshot();
const changes = UINode.$diff(before, after);
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
import { createStorage, CheckinSystem, SkinSystem } from '@lucid-2d/systems';
import { CheckinDialog } from '@lucid-2d/game-ui';

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

## GitHub Issues & PR — 社区协作

框架通过 GitHub Issues 接收来自业务项目（AI agent）的反馈，通过 PR 接收贡献。

### Issue 处理流程

每次对话开始时，检查是否有新 issue：

```bash
gh issue list --repo lucid-2d/lucid --state open
```

处理步骤：
1. 读取 issue 内容，评估是否合理
2. 如果是 bug → 复现、修复、写测试、关闭 issue
3. 如果是 feature → 评估边界（是否属于框架职责），实现或回复原因
4. 如果是 question → 回复解答，必要时补充文档
5. 修复后回复 issue 说明版本号，然后关闭

### PR 审核流程

```bash
gh pr list --repo lucid-2d/lucid --state open
```

审核标准：
1. 是否有对应的 issue 或合理的动机
2. 代码质量：测试覆盖、命名规范、无副作用
3. 边界检查：是否属于框架职责（游戏逻辑不进框架）
4. `pnpm -r test` 必须全部通过
5. 合入后更新文档和版本号

### 标签

| 标签 | 用途 |
|------|------|
| `bug` | 框架 bug |
| `feature` | 新功能请求 |
| `question` | 使用问题 |
| `feedback` | 通用反馈 |
| `from-star-drift` | 来自 star-drift 项目 |

## Commit conventions

- `feat:` new features
- `fix:` bug fixes
- `chore:` build/config changes
- Chinese commit messages are acceptable
