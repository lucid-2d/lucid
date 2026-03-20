/**
 * Toast — 全局提示（从 template toast.ts 迁移）
 *
 * 全局单例，不是 UINode。用法：
 *   Toast.show('success', '+100 金币');
 *
 * 需要每帧调用 Toast.update(dt) 和 Toast.draw(ctx, w, h)
 */

import { getTheme } from './theme.js';
import { ToastConfig, UIColors } from './tokens.js';

export type ToastType = 'success' | 'error' | 'warning' | 'reward';

interface ToastState {
  active: boolean;
  type: ToastType;
  message: string;
  elapsed: number;
  duration: number;
}

const _state: ToastState = {
  active: false, type: 'success', message: '', elapsed: 0, duration: 0,
};

export const Toast = {
  show(type: ToastType, message: string): void {
    _state.active = true;
    _state.type = type;
    _state.message = message;
    _state.elapsed = 0;
    _state.duration = ToastConfig.durations[type] ?? 1.8;
  },

  update(dt: number): void {
    if (!_state.active) return;
    _state.elapsed += dt;
    if (_state.elapsed >= _state.duration) _state.active = false;
  },

  draw(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!_state.active) return;

    const { elapsed, duration, type, message } = _state;
    const fadeIn = ToastConfig.fadeInDuration;
    const fadeOut = ToastConfig.fadeOutDuration;
    const holdEnd = duration - fadeOut;

    let alpha: number;
    let slideY = 0;

    if (elapsed < fadeIn) {
      alpha = elapsed / fadeIn;
    } else if (elapsed < holdEnd) {
      alpha = 1;
    } else {
      const t = (elapsed - holdEnd) / fadeOut;
      alpha = 1 - t;
      slideY = -ToastConfig.slideUp * t;
    }

    alpha = Math.max(0, Math.min(1, alpha));

    const font = `bold ${ToastConfig.fontSize}px ${getTheme().typography.family}`;
    ctx.save();
    ctx.font = font;
    const textW = ctx.measureText(message).width;

    const h = ToastConfig.height;
    const r = ToastConfig.radius;
    const padH = ToastConfig.paddingH;
    const w = textW + padH * 2;
    const x = (screenW - w) / 2;
    const baseY = screenH * ToastConfig.positionRatio - h / 2;
    const y = baseY + slideY;

    ctx.globalAlpha = alpha;

    // Capsule background
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);

    if (type === 'reward') {
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, UIColors.goldStart);
      grad.addColorStop(1, UIColors.goldEnd);
      ctx.fillStyle = grad;
    } else {
      const colorMap: Record<string, string> = {
        success: '#4caf50', error: '#f44336', warning: '#ff9800',
      };
      ctx.fillStyle = colorMap[type] ?? '#4caf50';
      ctx.globalAlpha = alpha * 0.85;
    }
    ctx.fill();

    // Text
    ctx.globalAlpha = alpha;
    ctx.fillStyle = type === 'reward' ? '#1a1a2e' : '#ffffff';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, screenW / 2, y + h / 2);

    ctx.restore();
  },

  get isActive(): boolean { return _state.active; },
};
