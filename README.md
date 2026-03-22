# Lucid

AI-first Canvas 2D game framework. Every element is a `UINode` — inspectable, recordable, replayable.

## Install

```bash
# 1. Configure GitHub Packages registry (one-time)
echo "@lucid-2d:registry=https://npm.pkg.github.com" >> .npmrc

# 2. Install
npm install @lucid-2d/core @lucid-2d/engine @lucid-2d/ui
# optional
npm install @lucid-2d/physics @lucid-2d/game-ui @lucid-2d/systems
# dev only (headless rendering)
npm install -D @napi-rs/canvas
```

## Quick start

```typescript
import { createApp } from '@lucid-2d/engine';
import { SceneNode } from '@lucid-2d/engine';
import { Button, Label, UIColors } from '@lucid-2d/ui';

class MenuScene extends SceneNode {
  constructor(private app) { super({ id: 'menu' }); }
  onEnter() {
    const btn = new Button({ id: 'start', text: 'Play', variant: 'primary', width: 200, height: 50 });
    btn.x = 95; btn.y = 400;
    btn.$on('tap', () => console.log('tapped'));
    this.addChild(btn);
  }
  protected draw(ctx) {
    ctx.fillStyle = UIColors.bgTop;
    ctx.fillRect(0, 0, 390, 844);
  }
}

const app = createApp({ platform: 'web', canvas: document.getElementById('game'), debug: true });
app.router.push(new MenuScene(app));
app.start();
window._app = app; // expose for AI agent
```

## Packages

### @lucid-2d/core

Node tree, events, animation, recording, timers, RNG, sprites, text, camera, nine-slice, i18n.

```typescript
import { UINode, Sprite, SpriteSheet, AnimatedSprite, NineSlice, Camera, I18n, InteractionRecorder, SeededRNG, Timer, CountdownTimer, wrapText, drawText } from '@lucid-2d/core';
```

| Export | Type | Description |
|--------|------|-------------|
| `UINode` | class | Base node. Properties: `x`, `y`, `width`, `height`, `visible`, `alpha`, `interactive`. Layout container: `layout`, `gap`, `padding`, `alignItems`, `justifyContent`, `wrap`, `columns`. Layout child: `flex`, `alignSelf`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. Methods: `addChild(node, index?)`, `removeChild(node)`, `removeFromParent()`, `findById(id)`, `hitTest(x, y)`, `$inspect(depth?)`, `$on(event, handler)`, `$emit(event, ...args)`, `$animate(props, duration, easing?)`, `$patch(props)`, `$query(selector)`, `$snapshot()`. Static: `UINode.$diff(before, after)`. Override: `draw(ctx)`, `$update(dt)`, `$render(ctx)`, `$inspectInfo()`. |
| `InteractionRecorder` | class | Records touch events with node paths and timestamps. `start()`, `stop()`, `dump()`, `clear()`. |
| `SeededRNG` | class | Mulberry32 deterministic RNG. `next(): number`, `int(min, max)`, `pick(array)`, `shuffle(array)`, `fork(): SeededRNG`. |
| `Timer` | class | Elapsed time tracker. `elapsed`, `pause()`, `resume()`, `reset()`. |
| `CountdownTimer` | class | Countdown with callbacks. `remaining`, `progress`, `onTick`, `onComplete`. |
| `Sprite` | class | Image UINode. Props: `image` (any CanvasImageSource), `sourceRect?: {x,y,w,h}` (sprite sheet cropping), `flipX?`, `flipY?`. Draws via `ctx.drawImage`. |
| `SpriteSheet` | class | Named regions in a sprite atlas. `new SpriteSheet(image, { idle: {x,y,w,h}, ... })`. Methods: `getRegion(name)`, `createSprite(name, opts?)`, `createAnimated(names, opts?)`, `regionNames`. Static: `fromGrid(image, cols, rows, cellW, cellH, names?)`. |
| `AnimatedSprite` | class | Frame sequence animation. Props: `frames: FrameDef[]`, `fps?: number`, `mode?: 'loop'\|'once'\|'pingpong'`, `autoPlay?`, `flipX?`, `flipY?`. Methods: `play()`, `pause()`, `stop()`, `restart()`. Events: `complete` (once mode). Static: `fromImages(images, opts?)`. |
| `wrapText(ctx, text, maxWidth)` | function | Auto line-wrap (word boundaries for Latin, character boundaries for CJK). Returns `string[]`. |
| `drawText(ctx, text, opts)` | function | Multi-line text rendering with alignment, vertical alignment, and `maxLines` ellipsis truncation. |
| `measureWrappedText(ctx, text, maxWidth, lineHeight)` | function | Measure wrapped text dimensions. Returns `{ width, height, lines }`. |
| `Camera` | class | Viewport for scrolling/zooming worlds. Props: `viewWidth`, `viewHeight`, `worldWidth?`, `worldHeight?`. Methods: `moveTo(x,y)`, `moveBy(dx,dy)`, `follow(target, opts?)`, `update(dt)`, `apply(ctx)`, `restore(ctx)`, `screenToWorld(sx,sy)`, `worldToScreen(wx,wy)`, `isVisible(x,y,w,h)`. |
| `NineSlice` | class | Nine-slice scaling UINode for panels/buttons. Props: `image`, `insets: [top, right, bottom, left]`. Corners stay fixed, edges stretch single-axis, center stretches both. |
| `I18n` | class | Internationalization. `new I18n({ en: {...}, zh: {...} })`. Methods: `t(key, ...args)` (positional params `{0}`, `{1}`), `locale` getter/setter, `add(locale, translations)`, `has(key)`, `locales`. Fallback: current → first locale → key. |

### @lucid-2d/engine

App lifecycle, scene routing, platform adapters, image loading, audio, keyboard.

```typescript
import { createApp, SceneNode, SceneRouter, loadImage, WebAdapter, WxAdapter, TtAdapter } from '@lucid-2d/engine';
```

| Export | Type | Description |
|--------|------|-------------|
| `createApp(opts)` | function | Creates app. Options: `{ platform?, canvas?, adapter?, debug?, debugOverlay?, rngSeed?, fixedTimestep? }`. Returns `App` with `.root`, `.router`, `.screen`, `.rng`, `.debug`, `.debugOverlay`, `.timeScale` (0=pause, 1=normal), `.fixedTimestep` (seconds, 0=disabled). `.start()`, `.stop()`, `.tick(dt)`, `.replay(records, speed)`, `.dumpInteractions()`. |
| `SceneNode` | class | Extends UINode. Override `onEnter()`, `onExit()`, `onPause()`, `onResume()`, `$fixedUpdate(dt)` (deterministic physics). |
| `SceneRouter` | class | `push(scene, transition?)`, `replace(scene, transition?)`, `pop(transition?)`. Transition: `{ type: 'fade'\|'slideLeft'\|'slideRight'\|'slideUp'\|'slideDown'\|'custom', duration, render? }`. `custom` type: `render(ctx, progress, oldScene, newScene)` takes over all rendering. Set `defaultTransition` for global default. |
| `WebAdapter` | class | Browser platform. Auto-creates from canvas element. |
| `WxAdapter` | class | WeChat Mini Game platform. Uses `wx.*` globals. |
| `TtAdapter` | class | Douyin Mini Game platform. Uses `tt.*` globals. |
| `loadImage(src, timeout?)` | function | Platform-aware async image loader. Returns Promise. Auto-detects Web/Wx/Tt. Use with `Sprite`. |
| `createTestApp(opts?)` | function | Headless test app. Options: `{ render?: boolean, width?, height? }`. When `render: true`, uses `@napi-rs/canvas` for real PNG output. Returns `TestApp` with `toImage(): Buffer` and `saveImage(path)`. |
| `tap(app, nodeId)` | function | Simulate tap on node by id. Emits touchstart + touchend. Returns `true` if found. |
| `touch(app, x, y, type?)` | function | Simulate touch at coordinates via hitTest. Type: `'start'` \| `'end'` \| `'move'`, default: full tap. Returns node path. |
| `assertTree(app, pattern)` | function | Assert `$inspect()` output contains all pattern lines (trimmed, ignoring extra nodes). Throws with diff on failure. |
| `generateTestCode(records)` | function | Convert `InteractionRecord[]` (from `dumpInteractions()`) to vitest test code string. |
| `AudioManager` | class | Cross-platform audio. `load(name, src)`, `register(name, handle)` (custom AudioHandle, e.g. Web Audio API synth), `playSfx(name)`, `playBgm(name, opts?)`, `stopBgm()`, `pauseBgm()`, `resumeBgm()`. Props: `sfxVolume`, `bgmVolume`, `muted`. |
| `createAudio(opts?)` | function | Create AudioManager with auto-detected platform (Web/Wx/Tt). |
| `createMockAudio()` | function | Mock AudioManager for testing (no real playback). |
| `Keyboard` | class | PC keyboard input. `bind(target)`, `isDown(key)`, `wasPressed(key)`, `wasReleased(key)`, `update()`. Test: `simulatePress(key)`, `simulateRelease(key)`. |
| `AssetLoader` | class | Batch asset loading. `add(name, src)`, `load(): Promise<Map>`, `onProgress`, `progress`, `get(name)`. Auto-detects image/audio/json. |

### @lucid-2d/ui

11 base components + design tokens.

```typescript
import { Button, Label, Icon, Modal, Toggle, TabBar, ScrollView, ProgressBar, Toast, Badge, Tag, UIColors } from '@lucid-2d/ui';
```

| Component | Key Props | Events |
|-----------|-----------|--------|
| `Button` | `id, text, variant: 'primary'\|'outline'\|'ghost'\|'gold', width, height, disabled` | `tap`. AI: `$inspectInfo` = variant, `$highlighted` = pressed, `$disabled`. |
| `Label` | `text, fontSize, fontWeight, color, align, wrap?, maxLines?, lineHeight?, verticalAlign?` | — . AI: `lineCount`, `truncated`, `renderedLines`. `$inspectInfo`: `3lines truncated`. |
| `Icon` | `name: IconName, size, color` | — . AI: `$text` = icon name. |
| `Modal` | `title, id, width, height, screenWidth, screenHeight` | `close`. Methods: `open()`, `close()`, `fitContent(bottomPad?)`. AI: `$inspectInfo` = open/closing/closed. |
| `Toggle` | `id, label, value: boolean, width, height` | `change(value)`. AI: `$highlighted` = ON state. |
| `TabBar` | `id, tabs: TabItem[], activeKey, width, height` | `change(key)`. AI: `$inspectInfo` = active key. |
| `ScrollView` | `id, width, height, contentHeight` | Touch-drag scrolling. Auto-captures touch (scroll vs tap detection). `scrollY`, `maxScrollY`. `$inspectInfo`: scroll position. |
| `ProgressBar` | `id, width, height, value: 0..1, color?` | — . AI: `$text` = percentage. |
| `Toast` | Singleton object | `Toast.show(type, message)`. Needs `Toast.update(dt)` + `Toast.draw(ctx, w, h)` per frame. |
| `Badge` | `text, color` | — |
| `Tag` | `text, color` | — |

**Icon names** (29): `check`, `close`, `coin`, `diamond`, `heart`, `star`, `lock`, `unlock`, `gift`, `fire`, `lightning`, `shield`, `sword`, `crown`, `trophy`, `medal`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `play`, `pause`, `settings`, `home`, `share`, `volume-on`, `volume-off`, `refresh`, `info`.

**UIColors** (28 tokens): `primary`, `secondary`, `accent`, `text`, `textSecondary`, `textLight`, `textMuted`, `textHint`, `panelFill`, `panelBorder`, `bgTop`, `bgBottom`, `cardBg`, `trackBg`, `divider`, `success`, `error`, `warning`, `goldStart`, `goldEnd`, `dangerStart`, `dangerEnd`, `overlayBg`, `buttonText`, `buttonOutlineText`, `buttonGhostText`, `toggleOn`, `toggleOff`.

### @lucid-2d/game-ui

9 business components for common game screens.

```typescript
import { CheckinDialog, ShopPanel, SettingsPanel, ResultPanel, LeaderboardPanel, BattlePassPanel, LuckyBoxDialog, CoinShopPanel, PrivacyDialog } from '@lucid-2d/game-ui';
```

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `CheckinDialog` | Daily check-in modal | `rewards: number[], currentDay, claimed`. Events: `claim(day, reward)`, `close`. |
| `ShopPanel` | Full-screen shop with tabs | `tabs: TabItem[], items: ShopItem[]`. Events: `purchase(item)`, `equip(item)`, `select(item)`, `close`. |
| `SettingsPanel` | Settings modal with toggles | `toggles: {id, label, value}[], links?, version?`. Events: `toggle(id, value)`, `link(id)`, `close`. |
| `ResultPanel` | Game result display | `stats: {icon: IconName, label, value}[], title, score`. |
| `LeaderboardPanel` | Ranked player list | `entries: {rank, name, score, isMe?}[]`. Top 3 get medal icons. |
| `BattlePassPanel` | Season pass rewards | `levels: BattlePassReward[], currentLevel, isPremium`. |
| `LuckyBoxDialog` | Random reward modal | `reward: {icon, name, amount}`. Events: `close`. |
| `CoinShopPanel` | IAP coin packages | `items: CoinShopItem[], balance`. Events: `purchase(item)`, `close`. |
| `PrivacyDialog` | Privacy policy modal | `content: string`. Events: `close`. |

### @lucid-2d/systems

10 operation systems. All use `Storage` interface for persistence.

```typescript
import { createStorage, CheckinSystem, SkinSystem, AchievementSystem, MissionSystem, BattlePassSystem, AdSystem, IAPSystem, ShareSystem, AnalyticsSystem } from '@lucid-2d/systems';
```

| System | Constructor | Key Methods |
|--------|-------------|-------------|
| `createStorage(prefix?)` | Auto-detects platform | Returns `Storage` (Web/Wx/Tt/Memory). |
| `CheckinSystem` | `{ storage, rewards: number[], prefix? }` | `getState(): CheckinState`, `claim(): number` (returns reward, 0 if already claimed). |
| `SkinSystem` | `{ storage, skins: SkinDefinition[], prefix? }` | `isOwned(id)`, `getEquipped(category)`, `purchase(id)`, `equip(id)`, `getSkinsByCategory(cat)`. Events: `purchase`, `equip`. |
| `AchievementSystem` | `{ storage, achievements: AchievementDefinition[], prefix? }` | `increment(id, amount?)`, `getStatus(id)`, `getAll()`. Events: `unlock`. |
| `MissionSystem` | `{ storage, missions: MissionDefinition[], prefix? }` | `increment(id, amount?)`, `claim(id)`, `getStatus(id)`, `resetDaily()`. Events: `complete`, `claim`. |
| `BattlePassSystem` | `{ storage, config: BattlePassConfig, prefix? }` | `addXP(amount)`, `claimReward(level, track)`, `getState()`. |
| `AdSystem` | `{ adapter: AdAdapter }` | `showRewarded(placement)`, `showBanner()`. |
| `IAPSystem` | `{ adapter: IAPAdapter, products }` | `purchase(productId)`, `getProducts()`. |
| `ShareSystem` | `{ adapter: ShareAdapter }` | `share(data)`. |
| `AnalyticsSystem` | `{ adapters: AnalyticsAdapter[] }` | `track(event, params?)`, `setUser(id, props?)`. |

### @lucid-2d/physics

Vectors, collision, particles, screen shake.

```typescript
import { vec2, add, sub, scale, normalize, distance, pointInRect, circleCircle, ParticlePool, ParticleEmitter, ParticlePresets, ScreenShake } from '@lucid-2d/physics';
```

| Export | Description |
|--------|-------------|
| `vec2(x, y)` | Create Vec2. All vec2 ops are pure functions: `add`, `sub`, `scale`, `normalize`, `dot`, `cross`, `distance`, `angle`, `fromAngle`, `perp`, `lerp`, `reflect`. |
| `pointInRect`, `pointInCircle`, `circleRect`, `circleCircle`, `lineCircle` | Collision detection. Returns `CollisionResult \| null` with `normal` and `depth`. |
| `ParticlePool` | Object pool with built-in renderer. `new ParticlePool(capacity, opts?)` — `opts.drawParticle?(ctx, p, t)` for custom rendering. `emit(x, y, opts?)`, `update(dt)`, `draw(ctx)`, `clear()`. `pool.active` returns active particles for manual iteration. Supports alpha fade, scale animation, friction. |
| `ParticleEmitter` | Continuous emitter. `new ParticleEmitter(pool, config)`. Props: `x`, `y`, `active`. Methods: `update(dt)`, `start()`, `stop()`. Config: `rate` (particles/sec) + all EmitOptions. |
| `ParticlePresets` | 5 presets: `explosion()`, `sparkle()`, `smoke()`, `fire()`, `trail()`. Each returns EmitOptions/EmitterConfig, accepts overrides. |
| `ScreenShake` | `start(intensity, duration)`, `update(dt)`, `apply(ctx)` / `restore(ctx)`. |

## Layout system

Flexbox subset. Set `layout` on any UINode to auto-position children.

### Container properties

| Property | Values | Description |
|----------|--------|-------------|
| `layout` | `'row'` \| `'column'` | Enable auto-layout |
| `gap` | `number` | Spacing between children |
| `padding` | `number` \| `[top, right, bottom, left]` | Inner padding |
| `alignItems` | `'start'` \| `'center'` \| `'end'` | Cross-axis alignment |
| `justifyContent` | `'start'` \| `'center'` \| `'end'` \| `'space-between'` | Main-axis distribution |
| `wrap` | `boolean` | Enable row wrapping |
| `columns` | `number` | Force N items per row (auto-calculates width) |

### Child properties

| Property | Values | Description |
|----------|--------|-------------|
| `flex` | `number` | Fill remaining space (proportional if multiple) |
| `alignSelf` | `'start'` \| `'center'` \| `'end'` | Override parent's alignItems |
| `minWidth` / `maxWidth` | `number` | Constrain flex sizing |
| `minHeight` / `maxHeight` | `number` | Constrain flex sizing |

### Examples

```typescript
// Vertical centered menu — no manual x/y
const menu = new UINode({ width: 390, height: 844, layout: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 });
menu.addChild(new Button({ text: 'Play', width: 200, height: 50 }));
menu.addChild(new Button({ text: 'Settings', width: 200, height: 44 }));

// HUD: left / center / right
const hud = new UINode({ width: 390, height: 44, layout: 'row', justifyContent: 'space-between', alignItems: 'center', padding: [0, 16, 0, 16] });

// Flex fill
const body = new UINode({ flex: 1, minHeight: 100 });

// Shop grid: 4 columns
const grid = new UINode({ width: 360, layout: 'row', wrap: true, columns: 4, gap: 8 });
```

## Templates

Ready-to-run game templates in `templates/` directory.

| Template | Description | Run |
|----------|-------------|-----|
| `starter` | Minimal game: menu → tap-the-target → result | `npx vite --config templates/starter/vite.config.ts` |
| `quiz` | Quiz game: question bank → timed options → scoring | `npx vite --config templates/quiz/vite.config.ts` |

Each template includes:
- `index.html` + `vite.config.ts` + `tsconfig.json`
- 3 scenes: menu → game/quiz → result
- Layout system usage (no manual x/y)
- `$inspect()` with game state
- Example test file with `createTestApp` + `assertTree`

## AI agent integration

### Headless rendering (no browser needed)

```typescript
import { createTestApp, tap, assertTree } from '@lucid-2d/engine';

const app = createTestApp({ render: true }); // real canvas via @napi-rs/canvas
app.router.push(new MenuScene(app));
app.tick(16);

app.saveImage('menu.png');           // save screenshot
const buf = app.toImage();            // get PNG buffer

// Debug overlay: shows node boundaries + IDs
app.debugOverlay = true;
app.tick(16);
app.saveImage('menu-debug.png');
```

### AI debugging tools

```typescript
// Query nodes (CSS-like selectors)
const buttons = app.root.$query('Button');
const play = app.root.$query('#play');
const menuBtns = app.root.$query('MenuScene Button');
const interactive = app.root.$query('.interactive');

// Batch-modify properties at runtime
app.root.findById('btn').$patch({ x: 100, width: 200 });

// Snapshot + diff for change detection
const before = app.root.$snapshot();
app.root.findById('score').$patch({ x: 50 });
const after = app.root.$snapshot();
const changes = UINode.$diff(before, after);
// → [{ path: 'root > score', prop: 'x', from: 0, to: 50 }]

// Custom state in $inspect output
class GameScene extends SceneNode {
  protected $inspectInfo() { return `score=${this.score} level=${this.level}`; }
}

// Pixel-level image comparison
const before = app.toImage();
tap(app, 'play');
app.tick(16);
const after = app.toImage();
const diff = await imageDiff(before, after);
// { totalPixels, diffPixels, diffPercent, identical, sameDimensions }
await assertImageChanged(before, after, 0.01, 0.5); // 1%-50% changed

// Verify text wrapping
const label = app.root.findById('desc') as Label;
expect(label.lineCount).toBe(3);
expect(label.truncated).toBe(false);
```

### Playwright

```typescript
// navigate to game
await page.goto('http://localhost:3456');

// inspect tree
const tree = await page.evaluate(() => window._app.root.$inspect());

// find and click
await page.evaluate(() => {
  const btn = window._app.root.findById('start');
  btn.$emit('tap');
});

// record and replay
const records = await page.evaluate(() => window._app.dumpInteractions());
await page.evaluate((r) => window._app.replay(r, 2), records);
```

### Key `window._app` API

```
_app.root                    — root UINode
_app.root.$inspect()         — text tree snapshot
_app.root.findById(id)       — find node by id
_app.root.$query(selector)   — CSS-like query (.interactive, Button, #id)
_app.root.$snapshot()        — structured state snapshot
_app.router                  — scene router (.push / .replace / .pop)
_app.rng                     — SeededRNG instance
_app.debugOverlay            — toggle debug overlay (node borders/IDs)
_app.timeScale               — time scale (0=pause, 0.5=slow, 1=normal, 2=fast)
_app.dumpInteractions()      — get recorded touch events
_app.replay(records, speed)  — replay (async, returns ReplayStep[])
```

## AI-driven level design

Traditional games rely on human designers to hand-place every collectible, obstacle, and enemy. Lucid enables a fundamentally different approach: **AI generates, simulates, evaluates, and iterates on level designs autonomously. Humans only play and give feedback.**

### The loop

```
AI generates level variant
  → Lucid simulates gameplay headlessly (createTestApp + tick)
  → AI evaluates metrics ($inspect, $query, toImage)
  → AI adjusts design based on results
  → Repeat until quality threshold met
  → Human plays and gives feedback
  → AI incorporates feedback and regenerates
```

### batchSimulate — run N variants, find the best

```typescript
import { batchSimulate, createTestApp } from '@lucid-2d/engine';

const result = batchSimulate({
  count: 50,
  setup: (i) => {
    const app = createTestApp({ render: true });
    const level = generateLevel(baseSeed + i);  // your level generator
    app.router.push(new PlayScene(app, level));
    return app;
  },
  run: (app) => {
    // Fast-forward 30 seconds of gameplay
    for (let t = 0; t < 1800; t++) app.tick(16);
  },
  evaluate: (app) => ({
    score: parseInt(app.root.findById('score')?.$text ?? '0'),
    collected: app.root.$query('.collected').length,
    missed: app.root.$query('.missed').length,
  }),
  screenshot: (i, m) => m.score > 1000,  // save screenshots of good runs
});

// Analyze results
console.log(result.summary);
// { score: { min: 200, max: 1500, avg: 800 }, collected: { ... } }

// Find best variant
const best = result.results.sort((a, b) => b.metrics.score - a.metrics.score)[0];
best.image && fs.writeFileSync('best-level.png', best.image);
```

### Entity — AI's eyes during simulation

When AI evaluates a level, it needs to see **game objects**, not just UI elements. `Entity` bridges this gap:

```typescript
import { Entity } from '@lucid-2d/core';

class GameScene extends SceneNode {
  onEnter() {
    // Register game objects for AI visibility
    for (const planet of this.planets) {
      this.addChild(Entity.from(planet, {
        id: `planet-${planet.id}`,
        props: ['x', 'y', 'radius', 'mass'],
      }));
    }
    for (const dust of this.dusts) {
      this.addChild(Entity.from(dust, {
        id: `dust-${dust.id}`,
        type: dust.isMemory ? 'MemoryDust' : 'Dust',
        props: ['x', 'y', 'alive'],
      }));
    }
  }
}

// Now AI can evaluate in batchSimulate:
evaluate: (app) => ({
  dustsCollected: app.root.$query('Dust').filter(e => !e.source.alive).length,
  totalDusts: app.root.$query('Dust').length,
  shipAlive: app.root.findById('ship')?.source.state !== 'dead',
  memoryFound: app.root.$query('MemoryDust').some(e => !e.source.alive),
}),
```

Without Entity, AI can only see `"GameScene#game score=3/4"` — it can't tell **which** dust was missed or **why**. With Entity, AI sees every game object and can make informed design decisions.

`Entity` + `$fixedUpdate` + `batchSimulate` form the complete AI evaluation pipeline:
- `$fixedUpdate` → deterministic physics (sim matches game)
- `Entity` → full game state visibility (AI sees everything)
- `batchSimulate` → parallel variant comparison (find the best)

### Why this works with Lucid

| Capability | How AI uses it |
|-----------|---------------|
| `createTestApp` | Run game without browser |
| `tick(16)` | Fast-forward gameplay (1800 ticks = 30s in ~100ms) |
| `$fixedUpdate` | Deterministic physics (sim = game) |
| `Entity` | See/query/modify game objects during simulation |
| `$inspect` / `$query` | Read full game state programmatically |
| `$patch` | Adjust level parameters at runtime |
| `batchSimulate` | Compare 50+ variants automatically |
| `SeededRNG` | Reproducible randomness for each variant |

### Pure logic simulation (no rendering)

For validation that doesn't need rendering — physics reachability, collision testing, path planning, economy balance — **import game modules directly** instead of going through createTestApp/batchSimulate:

```typescript
// level-validator.ts — pure Node.js, no canvas, no framework overhead
import { updatePhysics, createShip, launch } from './physics.js';
import { ALL_LEVELS } from './levels.js';

for (const level of ALL_LEVELS) {
  for (let angle = 0; angle < 360; angle += 10) {
    const ship = createShip();
    launch(ship, angle);
    for (let step = 0; step < 600; step++) {
      updatePhysics(ship, level.planets, 0.016);
      // check metrics...
    }
  }
}
// 50 levels × 36 angles × 600 steps = 1M ticks in < 2 seconds
```

This works because `@lucid-2d/physics` (Vec2, collision) and your game logic modules are independently importable — no canvas, no Scene, no App required. **Design your game modules this way**: keep physics/logic decoupled from rendering so they can run in both browser and Node.js.

Use `batchSimulate` when you need the **full stack** — Scene lifecycle, UI state, screenshots, `$inspect` trees. Use direct module imports when you only need **logic**.

### Game code provides

- **Level generator**: How to create level layouts (procedural or template-based)
- **AutoPlayer** (optional): AI strategy for simulating gameplay
- **Quality metrics**: What makes a "good" level for your game type

The framework handles the infrastructure. The AI handles the creativity.

## Scope and limitations

Lucid works best for **UI-heavy games** (card games, shops, check-ins, quizzes) where most elements are UINodes — `$inspect`, `$query`, and headless testing work out of the box.

For **physics/action games**, the framework provides the skeleton (app lifecycle, scene routing, particles, vectors, `$fixedUpdate`) but your core game objects (ships, planets, projectiles) will likely live outside the UINode tree, rendered directly via `ctx` in `draw()`. In this case:

- `$inspect()` won't see game objects automatically — expose state via `$inspectInfo()` override
- Design scenes to separate logic from rendering for headless-friendly architecture
- Use `$fixedUpdate` for deterministic physics, not `$update`
- For pure logic validation (reachability, balance), import game modules directly instead of using `batchSimulate`

See the "Pure logic simulation" section under AI-driven level design for the recommended pattern.

## Feedback

Used Lucid in a real project? We'd love to hear about your experience — what worked, what didn't, what's missing. **Your feedback directly shapes the framework's development.**

Open an issue with the `feedback` label: [GitHub Issues](https://github.com/lucid-2d/lucid/issues/new?labels=feedback)

## License

MIT
