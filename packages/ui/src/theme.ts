/**
 * 轻量主题系统 — 提供默认值，可通过 setTheme() 覆盖
 */

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: { top: string; bottom: string };
    text: { primary: string; secondary: string };
    panel: { fill: string; border: string };
    status: { success: string; error: string; warning: string };
  };
  typography: { family: string };
}

const defaultTheme: Theme = {
  colors: {
    primary: '#e94560',
    secondary: '#118ab2',
    accent: '#ffd166',
    background: { top: '#16213e', bottom: '#0f3460' },
    text: { primary: '#ffffff', secondary: '#a0a0b0' },
    panel: { fill: 'rgba(20,15,35,0.95)', border: 'rgba(255,255,255,0.15)' },
    status: { success: '#4caf50', error: '#f44336', warning: '#ff9800' },
  },
  typography: { family: 'sans-serif' },
};

let _theme: Theme = { ...defaultTheme };

export function getTheme(): Theme { return _theme; }
export function setTheme(t: Partial<Theme>): void {
  _theme = { ...defaultTheme, ...t, colors: { ...defaultTheme.colors, ...t.colors } } as Theme;
}
