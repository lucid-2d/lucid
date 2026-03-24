# {{PROJECT_NAME}}

基于 [Lucid](https://github.com/lucid-2d/lucid) 框架的 Canvas 2D 游戏。

## 命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建
pnpm test             # 运行测试
```

## Lucid 框架

本项目使用 Lucid — AI-first Canvas 2D 游戏框架。核心概念：

### 入口 (boot)

```typescript
import { boot } from '@lucid-2d/engine';

boot({
  debug: import.meta.env.DEV,
  assetRoot: 'img/',
  async onReady(app) {
    await app.router.push(new MenuScene(app));
  },
});
```

### 场景 (SceneNode)

所有页面继承 `SceneNode`，通过 `app.router` 管理导航：

```typescript
import { SceneNode, type App } from '@lucid-2d/engine';

class GameScene extends SceneNode {
  async preload() { /* 异步资源加载（完成前不调用 onEnter） */ }
  onEnter() { /* 初始化 UI 和游戏对象 */ }
  onExit() { /* 清理 */ }
  $update(dt: number) { /* 每帧更新 */ }
  protected draw(ctx: CanvasRenderingContext2D) { /* 渲染 */ }
}

// 导航
await app.router.push(scene);      // 压入（旧场景暂停）
await app.router.replace(scene);   // 替换（旧场景退出）
app.router.pop();                   // 弹出（恢复前一个）
```

### UI 组件

```typescript
import { Button, Label, Modal, ProgressBar, Toggle, TabBar, ScrollView } from '@lucid-2d/ui';
import { CheckinDialog, ShopPanel, SettingsPanel, ResultPanel } from '@lucid-2d/game-ui';
```

### 布局 (Flexbox 子集)

```typescript
new UINode({
  layout: 'column',           // 'row' | 'column'
  alignItems: 'center',       // 'start' | 'center' | 'end' | 'stretch'
  justifyContent: 'center',   // 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
  gap: 16,
});
```

### 运营系统

```typescript
import { createStorage, CheckinSystem, SkinSystem, AchievementSystem, MissionSystem } from '@lucid-2d/systems';
```

### 物理

```typescript
import { Vec2, ParticlePool, BezierPath } from '@lucid-2d/physics';
```

### 事件

```typescript
node.$on('tap', () => { /* 处理点击 */ });
node.$emit('tap');
```

### 测试

```typescript
import { createTestApp, tap, touch, assertTree } from '@lucid-2d/engine/testing';

const app = createTestApp();
app.router.push(new MenuScene(app));
app.tick(16);
tap(app, 'button-id');
touch(app, 200, 400);
```

### 无头截图

```typescript
const app = createTestApp({ render: true, assetRoot: path.join(__dirname, '../public') });
await app.router.push(scene);
await app.settle();
app.saveImage('screenshot.png');
```

## 注意事项

- HTML 中 canvas 的 `width/height` 是**逻辑像素**（如 390×844），DPR 缩放由框架自动处理
- 有 `preload()` 的场景，`router.push/replace` 返回 Promise，需要 `await`
- 框架完整文档：[Lucid README](https://github.com/lucid-2d/lucid)
