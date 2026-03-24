# 微信小游戏构建模板

## 快速开始

1. 复制本目录下的文件到你的项目：
   - `game.json` → `wx-build/game.json`
   - `project.config.json` → `wx-build/project.config.json`（修改 appid）
   - `vite.config.wx.ts` → 项目根目录
   - `main-wx.ts` → `src/main-wx.ts`（修改场景导入）

2. 在 `package.json` 中添加构建脚本：
   ```json
   {
     "scripts": {
       "build:wx": "vite build --config vite.config.wx.ts"
     }
   }
   ```

3. 将游戏资源复制到 `wx-build/img/`

4. 运行构建：
   ```bash
   npm run build:wx
   ```

5. 在微信开发者工具中打开 `wx-build/` 目录

## 项目结构

```
your-game/
├── src/
│   ├── main.ts          ← Web 入口
│   ├── main-wx.ts       ← WX 入口（从模板复制）
│   └── scenes/
├── vite.config.ts       ← Web 构建
├── vite.config.wx.ts    ← WX 构建（从模板复制）
└── wx-build/
    ├── game.json        ← WX 配置（从模板复制）
    ├── project.config.json
    ├── game.js          ← 构建产物
    └── img/             ← 资源文件
```

## Web vs WX 入口差异

| | Web (main.ts) | WX (main-wx.ts) |
|---|---|---|
| Canvas | `document.getElementById` | 自动创建 |
| Adapter | `WebAdapter` | `WxAdapter`（`platform: 'wx'`） |
| 资源路径 | `/img/bg.png`（绝对） | `img/bg.png`（相对） |
| assetRoot | 不需要 | `'img/'` |
| Debug | `true` | `false` |

## 共享代码

Web 和 WX 入口只有 adapter 和 assetRoot 不同，游戏逻辑（scenes、systems）完全共享。
建议将共享的启动逻辑抽到 `boot.ts`：

```typescript
// boot.ts
export function boot(app: App) {
  // 主题、音效、预加载...
  app.router.push(new MenuScene(app));
}

// main.ts
const app = createApp({ platform: 'web', canvas, debug: true });
boot(app);
app.start();

// main-wx.ts
const app = createApp({ platform: 'wx', assetRoot: 'img/' });
boot(app);
app.start();
```
