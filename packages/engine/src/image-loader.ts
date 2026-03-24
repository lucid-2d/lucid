/**
 * loadImage — 平台感知的异步图片加载器
 *
 * 自动检测运行环境（Web / 微信小游戏 / 抖音小游戏），
 * 使用对应 API 创建 Image 对象并加载。
 *
 * 返回的对象可直接传给 Sprite 组件或 ctx.drawImage()。
 */

// ── Asset root ──

let _assetRoot = '';

/**
 * Set the root path for resolving relative image paths.
 * Called automatically by `createApp({ assetRoot })`.
 *
 * ```typescript
 * setAssetRoot('img/');
 * await loadImage('bg.png'); // loads 'img/bg.png'
 * ```
 */
export function setAssetRoot(root: string): void {
  _assetRoot = root;
}

/** Get the current asset root path. */
export function getAssetRoot(): string {
  return _assetRoot;
}

function resolveAssetPath(src: string): string {
  if (!_assetRoot) return src;
  // Don't prefix absolute paths, data URIs, or URLs
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return _assetRoot + src;
}

// ── Image type ──

/** Cross-platform image type — compatible with ctx.drawImage() on all platforms */
export type ImageLike = any;

// ── loadImage ──

/**
 * 加载图片资源
 * @param src 图片路径（相对路径会自动拼接 assetRoot）
 * @param timeout 超时时间（毫秒），默认 10000
 * @returns Promise<ImageLike> 可用于 ctx.drawImage 的图片对象
 */
export function loadImage(src: string, timeout = 10000): Promise<ImageLike> {
  const resolvedSrc = resolveAssetPath(src);

  return new Promise((resolve, reject) => {
    let img: any;

    // 平台检测：微信小游戏
    if (typeof (globalThis as any).wx !== 'undefined' && (globalThis as any).wx.createImage) {
      img = (globalThis as any).wx.createImage();
    }
    // 平台检测：抖音小游戏
    else if (typeof (globalThis as any).tt !== 'undefined' && (globalThis as any).tt.createImage) {
      img = (globalThis as any).tt.createImage();
    }
    // Web 浏览器 / Headless
    else if (typeof Image !== 'undefined') {
      img = new Image();
    }
    else {
      reject(new Error('[loadImage] No image API available'));
      return;
    }

    // 超时保护
    const timer = setTimeout(() => {
      reject(new Error(`[loadImage] Timeout loading: ${resolvedSrc}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = (err: any) => {
      clearTimeout(timer);
      reject(new Error(`[loadImage] Failed to load: ${resolvedSrc}`));
    };

    img.src = resolvedSrc;
  });
}
