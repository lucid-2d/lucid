/**
 * 主题系统 — setTheme() 一次调用即可换皮
 *
 * 四类 design token：colors, typography, spacing, radii
 * 所有 UIColors / UILayout 值从 theme 读取，支持运行时切换。
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: { top: string; bottom: string };
  text: { primary: string; secondary: string; light: string; muted: string; hint: string };
  panel: { fill: string; border: string };
  card: { bg: string; border: string };
  overlay: string;
  divider: string;
  status: { success: string; error: string; warning: string };
  gold: { start: string; end: string };
  danger: { start: string; end: string };
  button: { text: string; outlineText: string; ghostText: string };
  toggle: { on: string; off: string };
}

export interface ThemeTypography {
  family: string;
  title: { size: number; weight: string };
  heading: { size: number; weight: string };
  body: { size: number; weight: string };
  caption: { size: number; weight: string };
}

export interface ThemeSpacing {
  /** Base unit (default 8) — all spacing derived from this */
  unit: number;
  /** Panel inner padding (default 16) */
  panelPadding: number;
  /** Vertical gap between buttons (default 12) */
  buttonGap: number;
  /** Content horizontal padding (default 16) */
  contentPadX: number;
  /** Minimum touch target size (default 44) */
  minTouchSize: number;
}

export interface ThemeRadii {
  /** Button corner radius (default 10) */
  button: number;
  /** Panel/modal corner radius (default 12) */
  panel: number;
  /** Card corner radius (default 8) */
  card: number;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
}

const defaultTheme: Theme = {
  colors: {
    primary: '#e94560',
    secondary: '#118ab2',
    accent: '#ffd166',
    background: { top: '#16213e', bottom: '#0f3460' },
    text: { primary: '#ffffff', secondary: '#a0a0b0', light: 'rgba(255,255,255,0.8)', muted: 'rgba(255,255,255,0.5)', hint: 'rgba(255,255,255,0.3)' },
    panel: { fill: 'rgba(20,15,35,0.95)', border: 'rgba(255,255,255,0.15)' },
    card: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
    overlay: 'rgba(0,0,0,0.65)',
    divider: 'rgba(255,255,255,0.06)',
    status: { success: '#4caf50', error: '#f44336', warning: '#ff9800' },
    gold: { start: '#f59e0b', end: '#d97706' },
    danger: { start: '#e94560', end: '#d32f4f' },
    button: { text: '#ffffff', outlineText: 'rgba(255,255,255,0.9)', ghostText: 'rgba(255,255,255,0.7)' },
    toggle: { on: '#4caf50', off: '#555' },
  },
  typography: {
    family: 'sans-serif',
    title: { size: 36, weight: 'bold' },
    heading: { size: 20, weight: 'bold' },
    body: { size: 14, weight: 'normal' },
    caption: { size: 11, weight: 'normal' },
  },
  spacing: {
    unit: 8,
    panelPadding: 16,
    buttonGap: 12,
    contentPadX: 16,
    minTouchSize: 44,
  },
  radii: {
    button: 10,
    panel: 12,
    card: 8,
  },
};

let _theme: Theme = { ...defaultTheme };

export function getTheme(): Theme { return _theme; }

/** Deep-merge partial theme into defaults */
export function setTheme(t: Partial<Theme>): void {
  _theme = {
    colors: { ...defaultTheme.colors, ...t.colors } as ThemeColors,
    typography: { ...defaultTheme.typography, ...t.typography } as ThemeTypography,
    spacing: { ...defaultTheme.spacing, ...t.spacing },
    radii: { ...defaultTheme.radii, ...t.radii },
  };
}

/** Reset theme to defaults */
export function resetTheme(): void {
  _theme = { ...defaultTheme };
}
