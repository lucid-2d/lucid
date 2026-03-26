/**
 * UI Design Tokens — 从 template tokens.ts 迁移
 * 所有颜色值为 getter，运行时从 getTheme() 读取。
 */

import { getTheme } from './theme.js';

// ── 按钮尺寸 ──────────────────────────────────

export interface ButtonSize {
  height: number;
  fontSize: number;
  fontWeight: string;
  radius: number;
  maxWidth: number;
  horizontalPad: number;
}

export const ButtonSizes: Record<string, ButtonSize> = {
  lg: { height: 56, fontSize: 18, fontWeight: 'bold', radius: 12, maxWidth: 280, horizontalPad: 48 },
  md: { height: 48, fontSize: 16, fontWeight: 'bold', radius: 10, maxWidth: 220, horizontalPad: 48 },
  sm: { height: 40, fontSize: 14, fontWeight: 'bold', radius: 8, maxWidth: 160, horizontalPad: 48 },
  xs: { height: 32, fontSize: 12, fontWeight: 'normal', radius: 6, maxWidth: 100, horizontalPad: 0 },
  icon: { height: 40, fontSize: 20, fontWeight: 'normal', radius: 20, maxWidth: 40, horizontalPad: 0 },
};

export function buttonWidth(size: ButtonSize, screenW: number): number {
  if (size === ButtonSizes.icon) return 40;
  return Math.min(screenW - size.horizontalPad, size.maxWidth);
}

// ── 颜色 Token ────────────────────────────────

export const UIColors = {
  // 主色
  get primary() { return getTheme().colors.primary; },
  get secondary() { return getTheme().colors.secondary; },
  get accent() { return getTheme().colors.accent; },

  // 文字
  get text() { return getTheme().colors.text.primary; },
  get textSecondary() { return getTheme().colors.text.secondary; },
  get textLight() { return getTheme().colors.text.light; },
  get textMuted() { return getTheme().colors.text.muted; },
  get textHint() { return getTheme().colors.text.hint; },

  // 面板 / 弹窗
  get panelFill() { return getTheme().colors.panel.fill; },
  get panelBorder() { return getTheme().colors.panel.border; },
  get overlayBg() { return getTheme().colors.overlay; },

  // 全屏背景渐变
  get bgTop() { return getTheme().colors.background.top; },
  get bgBottom() { return getTheme().colors.background.bottom; },

  // 卡片 / 表面
  get cardBg() { return getTheme().colors.card.bg; },
  get trackBg() { return getTheme().colors.card.border; },
  get divider() { return getTheme().colors.divider; },

  // 状态
  get success() { return getTheme().colors.status.success; },
  get error() { return getTheme().colors.status.error; },
  get warning() { return getTheme().colors.status.warning; },

  // 按钮渐变
  get goldStart() { return getTheme().colors.gold.start; },
  get goldEnd() { return getTheme().colors.gold.end; },
  get dangerStart() { return getTheme().colors.danger.start; },
  get dangerEnd() { return getTheme().colors.danger.end; },

  // 按钮文字
  get buttonText() { return getTheme().colors.button.text; },
  get buttonOutlineText() { return getTheme().colors.button.outlineText; },
  get buttonGhostText() { return getTheme().colors.button.ghostText; },

  // Toggle
  get toggleOn() { return getTheme().colors.toggle.on; },
  get toggleOff() { return getTheme().colors.toggle.off; },
};

// ── 布局（从 theme.spacing + theme.radii 读取） ──

export const UILayout = {
  get contentPadX() { return getTheme().spacing.contentPadX; },
  panelMaxWidth: (screenW: number) => Math.min(screenW - 40, 340),
  get buttonGapV() { return getTheme().spacing.buttonGap; },
  buttonGapH: 10,
  buttonPadH: 16,
  buttonPadV: 12,
  get minTouchSize() { return getTheme().spacing.minTouchSize; },
  get panelRadius() { return getTheme().radii.panel; },
  panelBorderWidth: 1,
  closeButtonSize: 28,
  get closeButtonMargin() { return getTheme().spacing.panelPadding; },
  headerHeight: 44,
  footerHeight: 56,
};

// ── Toast 配置 ────────────────────────────────

export const ToastConfig = {
  height: 36,
  radius: 18,
  paddingH: 24,
  fontSize: 14,
  positionRatio: 0.15,
  fadeInDuration: 0.15,
  fadeOutDuration: 0.3,
  slideUp: 8,
  durations: { success: 1.8, error: 2.0, warning: 2.0, reward: 2.5 } as Record<string, number>,
};

// ── 弹窗尺寸 ──────────────────────────────────

export const ModalSizes = {
  small:  { width: (sw: number) => Math.min(sw * 0.78, 300), minHeight: 180, maxHeight: 220 },
  medium: { width: (sw: number) => Math.min(sw * 0.85, 340), minHeight: 300, maxHeight: 420 },
  large:  { width: (sw: number) => Math.min(sw - 32, 360), heightRatio: 0.75 },
};

// ── 网格/卡片 ─────────────────────────────────

export const GridConfig = { gap: 8, containerPad: 16, selectedBorderWidth: 2 };
export const GridColumns = { checkin: 3, skin: 4, shop: 3, achievement: 2 };
export const ListItemHeights = { sm: 40, md: 56, lg: 72 };
