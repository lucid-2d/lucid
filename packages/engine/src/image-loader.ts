/**
 * loadImage — 平台感知的异步图片加载器
 *
 * 自动检测运行环境（Web / 微信小游戏 / 抖音小游戏），
 * 使用对应 API 创建 Image 对象并加载。
 *
 * 返回的对象可直接传给 Sprite 组件或 ctx.drawImage()。
 */

/**
 * 加载图片资源
 * @param src 图片路径（相对路径或绝对路径）
 * @param timeout 超时时间（毫秒），默认 10000
 * @returns Promise<CanvasImageSource> 可用于 ctx.drawImage 的图片对象
 */
export function loadImage(src: string, timeout = 10000): Promise<any> {
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
    // Web 浏览器
    else if (typeof Image !== 'undefined') {
      img = new Image();
    }
    else {
      reject(new Error('[loadImage] No image API available'));
      return;
    }

    // 超时保护
    const timer = setTimeout(() => {
      reject(new Error(`[loadImage] Timeout loading: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = (err: any) => {
      clearTimeout(timer);
      reject(new Error(`[loadImage] Failed to load: ${src}`));
    };

    img.src = src;
  });
}
