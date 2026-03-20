# Lucid

AI-first Canvas 2D game framework. Every element is a `UINode` — inspectable, recordable, replayable.

## Install

```bash
npm install @lucid/core @lucid/engine @lucid/ui
# optional
npm install @lucid/physics @lucid/game-ui @lucid/systems
```

## Quick start

```typescript
import { createApp } from '@lucid/engine';
import { SceneNode } from '@lucid/engine';
import { Button, Label, UIColors } from '@lucid/ui';

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

### @lucid/core

Node tree, events, animation, recording, timers, RNG.

```typescript
import { UINode, InteractionRecorder, SeededRNG, Timer, CountdownTimer } from '@lucid/core';
```

| Export | Type | Description |
|--------|------|-------------|
| `UINode` | class | Base node. Properties: `x`, `y`, `width`, `height`, `visible`, `alpha`, `interactive`. Layout container: `layout`, `gap`, `padding`, `alignItems`, `justifyContent`, `wrap`, `columns`. Layout child: `flex`, `alignSelf`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. Methods: `addChild(node, index?)`, `removeChild(node)`, `removeFromParent()`, `findById(id)`, `hitTest(x, y)`, `$inspect(depth?)`, `$on(event, handler)`, `$emit(event, ...args)`, `$animate(props, duration, easing?)`. Override: `draw(ctx)`, `$update(dt)`, `$render(ctx)`. |
| `InteractionRecorder` | class | Records touch events with node paths and timestamps. `start()`, `stop()`, `dump()`, `clear()`. |
| `SeededRNG` | class | Mulberry32 deterministic RNG. `next(): number`, `int(min, max)`, `pick(array)`, `shuffle(array)`, `fork(): SeededRNG`. |
| `Timer` | class | Elapsed time tracker. `elapsed`, `pause()`, `resume()`, `reset()`. |
| `CountdownTimer` | class | Countdown with callbacks. `remaining`, `progress`, `onTick`, `onComplete`. |

### @lucid/engine

App lifecycle, scene routing, platform adapters.

```typescript
import { createApp, SceneNode, SceneRouter, WebAdapter, WxAdapter, TtAdapter } from '@lucid/engine';
```

| Export | Type | Description |
|--------|------|-------------|
| `createApp(opts)` | function | Creates app. Options: `{ platform?: 'web'\|'wx'\|'tt', canvas?, adapter?, debug?, rngSeed? }`. Returns `App` with `.root`, `.router`, `.screen`, `.rng`, `.start()`, `.stop()`, `.tick(dt)`, `.replay(records, speed)`, `.dumpInteractions()`. |
| `SceneNode` | class | Extends UINode. Override `onEnter()` and `onExit()`. |
| `SceneRouter` | class | `push(scene)`, `replace(scene)`, `pop()`. |
| `WebAdapter` | class | Browser platform. Auto-creates from canvas element. |
| `WxAdapter` | class | WeChat Mini Game platform. Uses `wx.*` globals. |
| `TtAdapter` | class | Douyin Mini Game platform. Uses `tt.*` globals. |

### @lucid/ui

11 base components + design tokens.

```typescript
import { Button, Label, Icon, Modal, Toggle, TabBar, ScrollView, ProgressBar, Toast, Badge, Tag, UIColors } from '@lucid/ui';
```

| Component | Key Props | Events |
|-----------|-----------|--------|
| `Button` | `id, text, variant: 'primary'\|'outline'\|'ghost'\|'gold', width, height, disabled` | `tap` |
| `Label` | `text, fontSize, fontWeight, color, align: 'left'\|'center'\|'right', width, height` | — |
| `Icon` | `name: IconName, size, color` | — |
| `Modal` | `title, id, width, height, screenWidth, screenHeight` | `close`. Methods: `open()`, `close()`, `fitContent(bottomPad?)`. Children go in `.content`. Blocks touch behind overlay. |
| `Toggle` | `id, label, value: boolean, width, height` | `change(value)` |
| `TabBar` | `id, tabs: TabItem[], activeKey, width, height` | `change(key)` |
| `ScrollView` | `id, width, height, contentHeight` | Touch-drag scrolling built-in. |
| `ProgressBar` | `id, width, height, value: 0..1, color?` | — |
| `Toast` | Singleton object | `Toast.show(type, message)`. Needs `Toast.update(dt)` + `Toast.draw(ctx, w, h)` per frame. |
| `Badge` | `text, color` | — |
| `Tag` | `text, color` | — |

**Icon names** (29): `check`, `close`, `coin`, `diamond`, `heart`, `star`, `lock`, `unlock`, `gift`, `fire`, `lightning`, `shield`, `sword`, `crown`, `trophy`, `medal`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `play`, `pause`, `settings`, `home`, `share`, `volume-on`, `volume-off`, `refresh`, `info`.

**UIColors** (28 tokens): `primary`, `secondary`, `accent`, `text`, `textSecondary`, `textLight`, `textMuted`, `textHint`, `panelFill`, `panelBorder`, `bgTop`, `bgBottom`, `cardBg`, `trackBg`, `divider`, `success`, `error`, `warning`, `goldStart`, `goldEnd`, `dangerStart`, `dangerEnd`, `overlayBg`, `buttonText`, `buttonOutlineText`, `buttonGhostText`, `toggleOn`, `toggleOff`.

### @lucid/game-ui

9 business components for common game screens.

```typescript
import { CheckinDialog, ShopPanel, SettingsPanel, ResultPanel, LeaderboardPanel, BattlePassPanel, LuckyBoxDialog, CoinShopPanel, PrivacyDialog } from '@lucid/game-ui';
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

### @lucid/systems

10 operation systems. All use `Storage` interface for persistence.

```typescript
import { createStorage, CheckinSystem, SkinSystem, AchievementSystem, MissionSystem, BattlePassSystem, AdSystem, IAPSystem, ShareSystem, AnalyticsSystem } from '@lucid/systems';
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

### @lucid/physics

Vectors, collision, particles, screen shake.

```typescript
import { vec2, add, sub, scale, normalize, distance, pointInRect, circleCircle, ParticlePool, ScreenShake } from '@lucid/physics';
```

| Export | Description |
|--------|-------------|
| `vec2(x, y)` | Create Vec2. All vec2 ops are pure functions: `add`, `sub`, `scale`, `normalize`, `dot`, `cross`, `distance`, `angle`, `fromAngle`, `perp`, `lerp`, `reflect`. |
| `pointInRect`, `pointInCircle`, `circleRect`, `circleCircle`, `lineCircle` | Collision detection. Returns `CollisionResult \| null` with `normal` and `depth`. |
| `ParticlePool` | Object pool. `emit(x, y, opts?)`, `update(dt)`, `draw(ctx)`. |
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

## AI agent integration

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
_app.router                  — scene router (.push / .replace / .pop)
_app.rng                     — SeededRNG instance
_app.dumpInteractions()      — get recorded touch events
_app.replay(records, speed)  — replay (async, returns ReplayStep[])
```

## License

MIT
