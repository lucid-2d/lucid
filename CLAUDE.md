# Lucid — AI-first Canvas 2D Game Framework

**GitHub**: https://github.com/lucid-2d/lucid
**Packages**: `@lucid-2d/core`, `@lucid-2d/engine`, `@lucid-2d/ui`, `@lucid-2d/physics`, `@lucid-2d/game-ui`, `@lucid-2d/systems`

## What this is

Lucid is a Canvas 2D game framework designed for AI agents to build, inspect, debug, and test games. Every UI element is a `UINode` — a tree node that supports `$inspect()` for state snapshots, interaction recording, and deterministic replay. All rendering results are AI-queryable — line counts, truncation, button variants, scroll positions, particle states.

## Repository structure

```
packages/
  core/      — UINode, Entity, events, animation, Timer, SeededRNG, Sprite, AnimatedSprite, NineSlice, Camera, I18n, text utils
  engine/    — createApp/boot (timeScale/fixedTimestep/debugPanel/renderOneFrame/simulateTouch/applyPreset/settle/assetRoot), SceneRouter (transitions+custom+hitTest隔离+async preload), SceneNode (preload/$presets), platform adapters, headless rendering (CJK/Image/assetRoot polyfill), loadImage (assetRoot), audio (register), keyboard, asset loader, DebugPanel, test utils
  ui/        — 11 base components (Button, Label, Modal, Toggle, TabBar, ScrollView, ProgressBar(colorStops/label), ...)
  game-ui/   — 9 business components (CheckinDialog, ShopPanel, SettingsPanel, ...)
  physics/   — Vec2, collision (lineCircleDetailed/raycast), ParticlePool/Emitter/Presets, BezierPath, screen shake
  systems/   — 10 operation systems (Storage, Checkin, Skin, Achievement, Mission, ...)
playground/  — Visual component gallery (vite dev server)
templates/   — Game templates (starter, quiz, wx-build)
```

## Commands

```bash
pnpm install                    # install dependencies
pnpm -r test                    # run all 773 tests
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
// Recommended: boot() — auto-detects platform, single entry for Web/WX/TT
import { boot } from '@lucid-2d/engine';

boot({
  debug: import.meta.env.DEV,
  assetRoot: 'img/',
  async onReady(app) {
    app.router.push(new MyScene(app));
  },
});

// Or manual: createApp() — full control
import { createApp } from '@lucid-2d/engine';
const app = createApp({ platform: 'web', canvas, debug: true, assetRoot: 'img/' });
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

### Scene state control (screenshots & testing)

Scenes declare preset states via `$presets()`. Framework provides discovery + apply:

```typescript
class GameScene extends SceneNode {
  $presets() {
    return {
      gameplay:   { label: 'Normal',  setup: () => {} },
      paused:     { label: '暂停',    setup: (s) => s.togglePause() },
      death:      { label: '死亡',    setup: (s) => { s.ship.died = true; } },
      transition: { label: '转场',    setup: (s) => s.startTransition(9, 0, '叙事文案...', () => {}) },
    };
  }
}
```

Use with headless rendering for automated screenshots:

```typescript
const app = createTestApp({
  render: true,
  assetRoot: path.join(__dirname, '../public'),  // resolve relative image paths
  fonts: [{ family: 'GameFont', path: './assets/fonts/custom.ttf' }],  // optional custom fonts
});

app.router.push(new GameScene(app));
await app.settle(120);  // async tick loop — lets image loading / async onEnter complete

// Discover available presets
console.log(app.listPresets()); // ['gameplay', 'paused', 'death', 'transition']

// Apply preset → render one frame → screenshot
app.applyPreset('death');
app.renderOneFrame();          // render without advancing game logic
app.saveImage('death.png');

// Or use simulateTouch for interaction-based screenshots
app.simulateTouch(195, 506);   // hitTest → touchstart + touchend
app.renderOneFrame();
app.saveImage('after-tap.png');
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

## Local development (alias setup)

When developing a game that depends on local Lucid source:

```typescript
// vite.config.ts
import { lucidAliases } from '../path/to/lucid/dev-aliases.js';

export default defineConfig({
  resolve: { alias: lucidAliases() },
  // Returns array format (subpath exports first to avoid prefix matching):
  // [{ find: '@lucid-2d/engine/testing', replacement: '...' },
  //  { find: '@lucid-2d/core', replacement: '...' }, ...]
});
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

## 发版自测流程（强制）

每次代码修改发版前，必须按顺序执行以下步骤。**跳过任何步骤都不允许发版。**

### 1. 影响范围评估

改动前先回答：
- 这个改动影响哪些包？
- 是否涉及 UI/交互？（是 → 必须走 playground 验证）
- 是否涉及跨平台？（是 → 必须验证 mock canvas 兼容性）
- 是否涉及事件系统？（是 → 必须写 tap/touch 交互测试）

### 2. 单元测试

```bash
pnpm -r test  # 全量通过，零失败
```

每个新功能/修复必须有对应测试。交互类功能必须测试：
- hitTest 是否命中正确节点
- 事件是否正确分发（用 `tap(app, 'id')` 或 `touch(app, x, y)` 验证）
- 事件是否穿透到不应该接收的节点
- 模态组件是否阻断下层交互

### 3. TypeScript 编译

```bash
pnpm -r build  # 零错误
```

### 4. Playground 验证（UI/交互改动必须）

```bash
npx vite --config playground/vite.config.ts --port 3456
```

在浏览器中实际操作验证：
- 新增/修改的组件是否正常渲染
- 交互是否正常（点击、滚动、切换）
- 不同 tab 之间切换是否正常
- DebugPanel 功能验证：打开、关闭、Copy、穿透测试

### 5. 文档同步

检查以下文件是否需要更新：
- `README.md` — API 表、示例代码
- `CLAUDE.md` — 包描述、关键模式

### 6. 发版 checklist

```
[ ] pnpm -r test 全通过
[ ] pnpm -r build 零错误
[ ] playground 验证通过（UI/交互改动）
[ ] README.md 已更新（新 API/参数/行为变更）
[ ] CLAUDE.md 已同步
[ ] 版本号已 bump
[ ] git commit + push
[ ] GITHUB_TOKEN=xxx ./scripts/publish.sh（自动替换 workspace:*，不要手动 npm publish）
[ ] GitHub Issue 回复 + 关闭
```

### DebugPanel 教训记录

v0.2.7-v0.2.12 连续 4 个版本修复 DebugPanel 的低级 bug：
- v0.2.9: `$onMounted()` 方法名写错（不存在），事件处理器从未注册
- v0.2.10: Safari 剪贴板 API 在 Canvas 事件上下文被拦截
- v0.2.12: 面板打开时点击穿透到下层游戏

**根因**：新功能发版时没有自测交互行为，只验证了数据正确性。
**规则**：任何涉及 UI/交互的改动，必须在 playground 中实际操作验证后才能发版。

## Commit conventions

- `feat:` new features
- `fix:` bug fixes
- `chore:` build/config changes
- Chinese commit messages are acceptable
