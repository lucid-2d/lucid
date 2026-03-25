/**
 * auditUX — Built-in UX audit engine for headless testing.
 *
 * ```typescript
 * import { auditUX, defineRule } from '@lucid-2d/engine/testing';
 *
 * const result = auditUX(app);
 * expect(result.issues.filter(i => i.severity === 'error')).toEqual([]);
 * ```
 */

import { UINode } from '@lucid-2d/core';
import type { App } from './app.js';
import type { ScreenInfo } from './platform/detect.js';
import { SceneNode } from './scene.js';

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

export interface AuditOptions {
  /** Rule IDs to skip entirely */
  ignore?: string[];
  /** Override severity per rule ('off' to disable) */
  rules?: Record<string, 'error' | 'warning' | 'info' | 'off'>;
  /** When true, warnings also cause pass=false */
  strict?: boolean;
}

export interface AuditResult {
  /** true if no error-severity issues */
  pass: boolean;
  issues: AuditIssue[];
  /** Human-readable summary */
  summary: string;
  /** Structured layout data for AI consumption */
  layout: LayoutData;
}

export interface AuditIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  nodeId: string;
  nodePath: string;
  message: string;
}

export interface AuditRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  test: (app: App, screen: ScreenInfo) => AuditIssue[];
}

export interface LayoutData {
  sceneId: string;
  sceneType: string;
  screenSize: { w: number; h: number };
  interactiveNodes: Array<{
    id: string; type: string; text: string;
    bounds: { x: number; y: number; w: number; h: number };
    zone: 'top' | 'upper' | 'center' | 'lower' | 'bottom';
  }>;
  modals: Array<{ id: string; visible: boolean; children: string[] }>;
}

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════

interface Rect { x: number; y: number; w: number; h: number; }

function getWorldBounds(node: UINode): Rect {
  let wx = 0, wy = 0;
  let n: UINode | null = node;
  while (n) {
    wx += n.x;
    wy += n.y;
    n = n.$parent;
  }
  return { x: wx, y: wy, w: node.width, h: node.height };
}

function shouldSkipNode(node: UINode): boolean {
  return (node.id ?? '').startsWith('__');
}

function collectNodes(root: UINode, predicate?: (n: UINode) => boolean): UINode[] {
  const result: UINode[] = [];
  function walk(node: UINode): void {
    if (shouldSkipNode(node)) return;
    if (!predicate || predicate(node)) result.push(node);
    for (const child of node.$children) walk(child);
  }
  for (const child of root.$children) walk(child);
  return result;
}

function isVisible(node: UINode): boolean {
  let n: UINode | null = node;
  while (n) {
    if (!n.visible) return false;
    n = n.$parent;
  }
  return true;
}

function collectInteractive(root: UINode): UINode[] {
  return collectNodes(root, (n) =>
    n.interactive && isVisible(n) && !(n instanceof SceneNode)
  );
}

function isModalType(node: UINode): boolean {
  const t = node.$type;
  return t === 'Modal' || t === 'CheckinDialog' || t === 'SettingsPanel'
    || t === 'LuckyBoxDialog' || t === 'PrivacyDialog'
    || (typeof (node as any).open === 'function' && typeof (node as any).close === 'function');
}

function isInsideModal(node: UINode): boolean {
  let p = node.$parent;
  while (p) {
    if (isModalType(p)) return true;
    p = p.$parent;
  }
  return false;
}

function collectModals(root: UINode): UINode[] {
  return collectNodes(root, isModalType);
}

function getEffectiveAlpha(node: UINode): number {
  let a = 1;
  let n: UINode | null = node;
  while (n) {
    a *= n.alpha;
    n = n.$parent;
  }
  return a;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectGap(a: Rect, b: Rect): number {
  const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.max(gapX, gapY);
}

function getZone(y: number, h: number, screenH: number): 'top' | 'upper' | 'center' | 'lower' | 'bottom' {
  const centerY = (y + h / 2) / screenH;
  if (centerY < 0.1) return 'top';
  if (centerY < 0.3) return 'upper';
  if (centerY < 0.6) return 'center';
  if (centerY < 0.8) return 'lower';
  return 'bottom';
}

// ── Emoji detection ──

const EMOJI_RE = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

function hasEmoji(text: string): boolean {
  return EMOJI_RE.test(text);
}

// ── Pattern matching ──

interface PatternDef {
  idKeywords: string[];
  textKeywords: string[];
}

const PATTERNS: Record<string, PatternDef> = {
  pause:    { idKeywords: ['pause'], textKeywords: ['暂停', 'pause'] },
  back:     { idKeywords: ['back', 'exit', 'close'], textKeywords: ['返回', '退出', 'back'] },
  settings: { idKeywords: ['settings'], textKeywords: ['设置', 'settings', '⚙'] },
  privacy:  { idKeywords: ['privacy'], textKeywords: ['隐私', 'privacy'] },
  continue: { idKeywords: ['continue', 'resume'], textKeywords: ['继续', 'continue'] },
  home:     { idKeywords: ['home', 'menu'], textKeywords: ['首页', '主页', 'home', '返回主页'] },
  restart:  { idKeywords: ['restart', 'retry'], textKeywords: ['重新开始', '再来', '再来一局', '重试', 'restart', 'retry'] },
  play:     { idKeywords: ['play', 'start'], textKeywords: ['开始', '开始游戏', 'play', 'start'] },
  dismiss:  { idKeywords: ['dismiss', 'close', 'modal-close'], textKeywords: ['×', '关闭', 'close', '✕'] },
  quit:     { idKeywords: ['quit', 'abandon'], textKeywords: ['放弃', 'quit'] },
  confirm:  { idKeywords: ['confirm'], textKeywords: ['确认', '确定', 'confirm'] },
  revive:   { idKeywords: ['revive'], textKeywords: ['复活', 'revive'] },
  ad:       { idKeywords: ['ad', 'reward'], textKeywords: ['看广告', '观看广告'] },
};

function matchesPattern(node: UINode, patternName: string): boolean {
  const p = PATTERNS[patternName];
  if (!p) return false;
  const id = (node.id ?? '').toLowerCase();
  const text = node.$text ?? '';
  const textLower = text.toLowerCase();
  for (const kw of p.idKeywords) {
    if (id.includes(kw)) return true;
  }
  for (const kw of p.textKeywords) {
    // Chinese: check original text; English: case-insensitive
    if (text.includes(kw) || textLower.includes(kw.toLowerCase())) return true;
  }
  return false;
}

function matchesAnyPattern(node: UINode, ...patternNames: string[]): boolean {
  return patternNames.some(p => matchesPattern(node, p));
}

function inferSceneType(scene: SceneNode): string {
  const id = (scene.id ?? '').toLowerCase();
  const type = scene.$type.toLowerCase();
  const combined = id + ' ' + type;
  if (/menu|main|home|title/.test(combined)) return 'menu';
  if (/game|play|level|stage|combat|endless|boss/.test(combined)) return 'gameplay';
  if (/result|gameover|game.over|end|score|settle/.test(combined)) return 'result';
  if (/settings|options|config/.test(combined)) return 'settings';
  if (/shop|store|market|coin/.test(combined)) return 'shop';
  if (/map|world|select/.test(combined)) return 'map';
  if (/checkin|sign/.test(combined)) return 'checkin';
  if (/leaderboard|rank/.test(combined)) return 'leaderboard';
  return 'unknown';
}

function getAuditSkip(scene: SceneNode): string[] {
  return (scene.constructor as any).auditSkip ?? [];
}

function buildIssue(rule: string, severity: AuditIssue['severity'], node: UINode, message: string): AuditIssue {
  return { rule, severity, nodeId: node.id ?? '', nodePath: node.$path(), message };
}

// Known interactive component types (from @lucid-2d/ui and @lucid-2d/game-ui)
const INTERACTIVE_COMPONENT_TYPES = new Set([
  'Button', 'IconButton', 'Toggle', 'TabBar', 'ScrollView', 'Modal',
  'CheckinDialog', 'SettingsPanel', 'ResultPanel', 'ShopPanel',
  'LeaderboardPanel', 'BattlePassPanel', 'LuckyBoxDialog', 'CoinShopPanel',
  'PrivacyDialog', 'DebugPanel',
]);

// ══════════════════════════════════════════
// Built-in Rules (26)
// ══════════════════════════════════════════

const _builtinRules: AuditRule[] = [];

function rule(id: string, severity: AuditIssue['severity'], test: AuditRule['test']): void {
  _builtinRules.push({ id, severity, test });
}

// ── Error Rules (15) ──

// #1 no-overlap
rule('no-overlap', 'error', (app, screen) => {
  const issues: AuditIssue[] = [];
  function checkSiblings(parent: UINode): void {
    const visible = parent.$children.filter(c =>
      !shouldSkipNode(c) && isVisible(c) && !isModalType(c) && getEffectiveAlpha(c) >= 0.1
      && c.width > 0 && c.height > 0
    );
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = getWorldBounds(visible[i]);
        const b = getWorldBounds(visible[j]);
        if (rectsOverlap(a, b)) {
          issues.push(buildIssue('no-overlap', 'error', visible[i],
            `Overlaps with ${visible[j].id || visible[j].$type} (${Math.round(a.x)},${Math.round(a.y)} ${a.w}x${a.h} vs ${Math.round(b.x)},${Math.round(b.y)} ${b.w}x${b.h})`));
        }
      }
    }
    for (const child of parent.$children) {
      if (!shouldSkipNode(child) && child.$children.length > 0) {
        checkSiblings(child);
      }
    }
  }
  checkSiblings(app.root);
  return issues;
});

// #2 touch-target-minimum
rule('touch-target-minimum', 'error', (app) => {
  return collectInteractive(app.root)
    .filter(n => n.width < 44 || n.height < 44)
    .map(n => buildIssue('touch-target-minimum', 'error', n,
      `Touch target ${n.width}x${n.height} is below 44x44 minimum`));
});

// #3 button-within-bounds
rule('button-within-bounds', 'error', (app, screen) => {
  return collectInteractive(app.root)
    .filter(n => {
      const b = getWorldBounds(n);
      return b.x < 0 || b.y < 0 || b.x + b.w > screen.width || b.y + b.h > screen.height;
    })
    .map(n => {
      const b = getWorldBounds(n);
      return buildIssue('button-within-bounds', 'error', n,
        `Button at (${Math.round(b.x)},${Math.round(b.y)}) ${b.w}x${b.h} extends outside screen ${screen.width}x${screen.height}`);
    });
});

// #4 must-use-components
rule('must-use-components', 'error', (app) => {
  return collectInteractive(app.root)
    .filter(n => !INTERACTIVE_COMPONENT_TYPES.has(n.$type))
    .map(n => buildIssue('must-use-components', 'error', n,
      `Interactive node uses raw ${n.$type} instead of Button/Toggle/etc.`));
});

// #5 scene-has-exit
rule('scene-has-exit', 'error', (app) => {
  const scene = app.router.current;
  if (!scene) return [];
  if (inferSceneType(scene) === 'menu') return [];
  const nodes = collectInteractive(app.root);
  const hasExit = nodes.some(n => matchesAnyPattern(n, 'back', 'pause', 'dismiss', 'quit', 'home'));
  if (!hasExit) {
    return [buildIssue('scene-has-exit', 'error', scene,
      `Non-menu scene "${scene.id}" has no exit/back/pause button`)];
  }
  return [];
});

// #6 modal-has-close
rule('modal-has-close', 'error', (app) => {
  const issues: AuditIssue[] = [];
  for (const modal of collectModals(app.root)) {
    const children = collectNodes(modal);
    const hasClose = children.some(c => matchesAnyPattern(c, 'dismiss', 'back'));
    if (!hasClose) {
      issues.push(buildIssue('modal-has-close', 'error', modal,
        `Modal "${modal.id}" has no close/dismiss button`));
    }
  }
  return issues;
});

// #7 pause-has-modal
rule('pause-has-modal', 'error', (app) => {
  const scene = app.router.current;
  if (!scene) return [];
  if (inferSceneType(scene) !== 'gameplay') return [];
  const nodes = collectInteractive(app.root);
  const hasPause = nodes.some(n => matchesPattern(n, 'pause'));
  if (!hasPause) return []; // no pause button → game-scene-has-pause will catch it
  const modals = collectModals(app.root);
  if (modals.length === 0) {
    return [buildIssue('pause-has-modal', 'error', scene,
      `Scene has pause button but no Modal component for pause menu`)];
  }
  return [];
});

// #8 pause-modal-contents
rule('pause-modal-contents', 'error', (app) => {
  const issues: AuditIssue[] = [];
  const modals = collectModals(app.root);
  for (const modal of modals) {
    const id = (modal.id ?? '').toLowerCase();
    const text = (modal.$text ?? '').toLowerCase();
    if (!id.includes('pause') && !text.includes('暂停') && !text.includes('pause')) continue;
    const children = collectNodes(modal);
    const required = ['continue', 'home', 'restart', 'settings'] as const;
    for (const pattern of required) {
      if (!children.some(c => matchesPattern(c, pattern))) {
        issues.push(buildIssue('pause-modal-contents', 'error', modal,
          `Pause modal missing "${pattern}" action`));
      }
    }
  }
  return issues;
});

// #9 menu-has-settings
rule('menu-has-settings', 'error', (app) => {
  const scene = app.router.current;
  if (!scene || inferSceneType(scene) !== 'menu') return [];
  const nodes = collectNodes(app.root);
  if (!nodes.some(n => matchesPattern(n, 'settings'))) {
    return [buildIssue('menu-has-settings', 'error', scene,
      `Menu scene missing settings button`)];
  }
  return [];
});

// #10 no-dead-end
rule('no-dead-end', 'error', (app) => {
  const scene = app.router.current;
  if (!scene) return [];
  const interactive = collectInteractive(app.root);
  const actionable = interactive.filter(n => !(n as any).$disabled && !(n as any).disabled);
  if (actionable.length === 0) {
    return [buildIssue('no-dead-end', 'error', scene,
      `Scene "${scene.id}" has no actionable buttons — user is stuck`)];
  }
  return [];
});

// #11 modal-blocks-input
rule('modal-blocks-input', 'error', (app, screen) => {
  const issues: AuditIssue[] = [];
  const visibleModals = collectModals(app.root).filter(m => isVisible(m));
  if (visibleModals.length === 0) return [];
  // Sample a few points outside modal area
  const testPoints = [
    { x: 10, y: 10 }, { x: screen.width / 2, y: 10 },
    { x: 10, y: screen.height / 2 }, { x: screen.width - 10, y: screen.height - 10 },
  ];
  for (const pt of testPoints) {
    const hit = app.root.hitTest(pt.x, pt.y);
    if (hit && !isModalType(hit) && hit.interactive) {
      // Check if hit node is inside any visible modal
      let insideModal = false;
      let p: UINode | null = hit;
      while (p) {
        if (isModalType(p)) { insideModal = true; break; }
        p = p.$parent;
      }
      if (!insideModal) {
        issues.push(buildIssue('modal-blocks-input', 'error', hit,
          `Node "${hit.id}" is reachable via hitTest while Modal is open`));
        break; // one is enough
      }
    }
  }
  return issues;
});

// #12 result-scene-has-actions
rule('result-scene-has-actions', 'error', (app) => {
  const scene = app.router.current;
  if (!scene || inferSceneType(scene) !== 'result') return [];
  const nodes = collectNodes(app.root);
  const hasAction = nodes.some(n => matchesAnyPattern(n, 'restart', 'home', 'play', 'revive'));
  if (!hasAction) {
    return [buildIssue('result-scene-has-actions', 'error', scene,
      `Result scene missing retry/home/play action button`)];
  }
  return [];
});

// #13 overlay-stacking-escape
rule('overlay-stacking-escape', 'error', (app) => {
  const issues: AuditIssue[] = [];
  const visibleModals = collectModals(app.root).filter(m => isVisible(m));
  for (const modal of visibleModals) {
    const children = collectNodes(modal);
    const hasClose = children.some(c => matchesAnyPattern(c, 'dismiss', 'back'));
    if (!hasClose) {
      issues.push(buildIssue('overlay-stacking-escape', 'error', modal,
        `Visible overlay "${modal.id}" has no close/dismiss mechanism`));
    }
  }
  return issues;
});

// #14 narrator-screen-size
rule('narrator-screen-size', 'error', (app, screen) => {
  const issues: AuditIssue[] = [];
  const fullscreenNodes = collectNodes(app.root, n =>
    !(n instanceof SceneNode) && n.width >= screen.width * 0.95 && n.height >= screen.height * 0.95
    && isVisible(n) && getEffectiveAlpha(n) > 0.1
  );
  for (const node of fullscreenNodes) {
    if (Math.abs(node.width - screen.width) > 2 || Math.abs(node.height - screen.height) > 2) {
      issues.push(buildIssue('narrator-screen-size', 'error', node,
        `Fullscreen overlay ${node.width}x${node.height} doesn't match screen ${screen.width}x${screen.height}`));
    }
  }
  return issues;
});

// #15 safe-area-respected
rule('safe-area-respected', 'warning', (app, screen) => {
  const issues: AuditIssue[] = [];
  for (const node of collectInteractive(app.root)) {
    const b = getWorldBounds(node);
    if (screen.safeTop > 0 && b.y < screen.safeTop) {
      issues.push(buildIssue('safe-area-respected', 'warning', node,
        `Interactive node at y=${Math.round(b.y)} is above safeTop=${screen.safeTop}`));
    }
    if (screen.safeBottom > 0 && screen.safeBottom < screen.height && b.y + b.h > screen.safeBottom) {
      issues.push(buildIssue('safe-area-respected', 'warning', node,
        `Interactive node at y=${Math.round(b.y + b.h)} is below safeBottom=${screen.safeBottom}`));
    }
  }
  return issues;
});

// ── Warning Rules (9) ──

// #16 no-emoji
rule('no-emoji', 'warning', (app) => {
  return collectNodes(app.root, n => {
    const t = n.$text;
    return !!t && hasEmoji(t);
  }).map(n => buildIssue('no-emoji', 'warning', n,
    `Text "${(n.$text ?? '').substring(0, 30)}" contains emoji`));
});

// #17 touch-target-spacing
rule('touch-target-spacing', 'warning', (app) => {
  const issues: AuditIssue[] = [];
  function checkChildren(parent: UINode): void {
    const interactive = parent.$children.filter(c =>
      c.interactive && isVisible(c) && !shouldSkipNode(c) && !(c instanceof SceneNode)
    );
    for (let i = 0; i < interactive.length; i++) {
      for (let j = i + 1; j < interactive.length; j++) {
        const a = getWorldBounds(interactive[i]);
        const b = getWorldBounds(interactive[j]);
        const gap = rectGap(a, b);
        if (gap > 0 && gap < 8) {
          issues.push(buildIssue('touch-target-spacing', 'warning', interactive[i],
            `Only ${Math.round(gap)}px from ${interactive[j].id || interactive[j].$type} (recommend ≥8px)`));
        }
      }
    }
    for (const child of parent.$children) {
      if (!shouldSkipNode(child)) checkChildren(child);
    }
  }
  checkChildren(app.root);
  return issues;
});

// #18 touch-target-recommended
rule('touch-target-recommended', 'warning', (app) => {
  return collectInteractive(app.root)
    .filter(n => (n.width >= 44 && n.height >= 44) && (n.width < 48 || n.height < 48))
    .map(n => buildIssue('touch-target-recommended', 'warning', n,
      `Touch target ${n.width}x${n.height} meets minimum but recommend ≥48x48`));
});

// #19 exit-button-position
rule('exit-button-position', 'warning', (app, screen) => {
  const issues: AuditIssue[] = [];
  const nodes = collectInteractive(app.root)
    .filter(n => matchesAnyPattern(n, 'back', 'pause'))
    .filter(n => !isModalType(n))
    .filter(n => !isInsideModal(n));
  for (const node of nodes) {
    const b = getWorldBounds(node);
    const inTopZone = b.y < screen.height * 0.15;
    const inCorner = b.x < screen.width * 0.2 || b.x + b.w > screen.width * 0.8;
    if (!inTopZone || !inCorner) {
      issues.push(buildIssue('exit-button-position', 'warning', node,
        `Exit/pause button at (${Math.round(b.x)},${Math.round(b.y)}) should be in top corner`));
    }
    if (node.width < 36 || node.height < 36) {
      issues.push(buildIssue('exit-button-position', 'warning', node,
        `Exit/pause button ${node.width}x${node.height} should be ≥36x36`));
    }
  }
  return issues;
});

// #20 button-has-text
rule('button-has-text', 'warning', (app) => {
  return collectNodes(app.root, n => n.$type === 'Button' && isVisible(n))
    .filter(n => !n.$text || n.$text.trim() === '')
    .map(n => buildIssue('button-has-text', 'warning', n,
      `Button "${n.id}" has no text`));
});

// #21 font-size-minimum
rule('font-size-minimum', 'warning', (app) => {
  return collectNodes(app.root, n => n.$type === 'Label' && isVisible(n))
    .filter(n => {
      const info = (n as any).fontSize;
      return typeof info === 'number' && info < 10;
    })
    .map(n => buildIssue('font-size-minimum', 'warning', n,
      `Label "${n.id}" fontSize ${(n as any).fontSize} is below 10px minimum`));
});

// #22 text-contrast
rule('text-contrast', 'warning', (app) => {
  return collectNodes(app.root, n => !!n.$text && isVisible(n))
    .filter(n => getEffectiveAlpha(n) < 0.4)
    .map(n => buildIssue('text-contrast', 'warning', n,
      `Text "${(n.$text ?? '').substring(0, 20)}" effective alpha ${getEffectiveAlpha(n).toFixed(2)} < 0.4`));
});

// #23 menu-has-privacy
rule('menu-has-privacy', 'warning', (app) => {
  const scene = app.router.current;
  if (!scene || inferSceneType(scene) !== 'menu') return [];
  const nodes = collectNodes(app.root);
  if (!nodes.some(n => matchesPattern(n, 'privacy'))) {
    return [buildIssue('menu-has-privacy', 'warning', scene,
      `Menu scene missing privacy policy button`)];
  }
  return [];
});

// #24 game-scene-has-pause
rule('game-scene-has-pause', 'warning', (app) => {
  const scene = app.router.current;
  if (!scene || inferSceneType(scene) !== 'gameplay') return [];
  const nodes = collectNodes(app.root);
  if (!nodes.some(n => matchesPattern(n, 'pause'))) {
    return [buildIssue('game-scene-has-pause', 'warning', scene,
      `Gameplay scene missing pause button`)];
  }
  return [];
});

// ── Info Rules (2) ──

// #25 primary-action-reachable
rule('primary-action-reachable', 'info', (app, screen) => {
  const issues: AuditIssue[] = [];
  const primaryButtons = collectNodes(app.root, n =>
    n.$type === 'Button' && isVisible(n)
    && ((n as any).variant === 'primary' || matchesPattern(n, 'play'))
  );
  for (const btn of primaryButtons) {
    const b = getWorldBounds(btn);
    const centerY = b.y + b.h / 2;
    if (centerY < screen.height * 0.4) {
      issues.push(buildIssue('primary-action-reachable', 'info', btn,
        `Primary button at y=${Math.round(centerY)} is in top 40% — may be hard to reach on mobile`));
    }
  }
  return issues;
});

// #26 hud-element-visibility
rule('hud-element-visibility', 'info', (app, screen) => {
  const scene = app.router.current;
  if (!scene || inferSceneType(scene) !== 'gameplay') return [];
  const issues: AuditIssue[] = [];
  const topNodes = collectNodes(app.root, n =>
    isVisible(n) && n.height > 0 && n.height < 30
  ).filter(n => {
    const b = getWorldBounds(n);
    return b.y < screen.height * 0.1;
  });
  for (const node of topNodes) {
    if (node.height < 8) {
      issues.push(buildIssue('hud-element-visibility', 'info', node,
        `HUD element height ${node.height} < 8px — may be invisible on device`));
    }
    if (getEffectiveAlpha(node) < 0.5) {
      issues.push(buildIssue('hud-element-visibility', 'info', node,
        `HUD element alpha ${getEffectiveAlpha(node).toFixed(2)} < 0.5 — may be hard to see`));
    }
  }
  return issues;
});

// ══════════════════════════════════════════
// Custom Rules Registry
// ══════════════════════════════════════════

const _customRules: AuditRule[] = [];

/** Register a custom audit rule */
export function defineRule(r: AuditRule): void {
  _customRules.push(r);
}

// ══════════════════════════════════════════
// Layout Data Builder
// ══════════════════════════════════════════

function buildLayoutData(app: App, screen: ScreenInfo): LayoutData {
  const scene = app.router.current;
  const sceneId = scene?.id ?? '(none)';
  const sceneType = scene ? inferSceneType(scene) : 'unknown';

  const interactiveNodes = collectInteractive(app.root).map(node => {
    const b = getWorldBounds(node);
    return {
      id: node.id ?? '',
      type: node.$type,
      text: node.$text ?? '',
      bounds: { x: Math.round(b.x), y: Math.round(b.y), w: b.w, h: b.h },
      zone: getZone(b.y, b.h, screen.height),
    };
  });

  const modals = collectModals(app.root).map(modal => ({
    id: modal.id ?? '',
    visible: isVisible(modal),
    children: modal.$children.map(c => c.id || c.$type),
  }));

  return { sceneId, sceneType, screenSize: { w: screen.width, h: screen.height }, interactiveNodes, modals };
}

// ══════════════════════════════════════════
// Main: auditUX
// ══════════════════════════════════════════

export function auditUX(app: App, options?: AuditOptions): AuditResult {
  const screen = app.screen;
  const scene = app.router.current;

  // Merge built-in + custom rules
  const allRules = [..._builtinRules, ..._customRules];

  // Scene-level skip
  const sceneSkips = scene ? getAuditSkip(scene) : [];

  // Build ignore set
  const ignoreSet = new Set([...(options?.ignore ?? []), ...sceneSkips]);
  const severityOverrides = options?.rules ?? {};

  // Run rules
  const allIssues: AuditIssue[] = [];

  for (const r of allRules) {
    if (ignoreSet.has(r.id)) continue;
    const override = severityOverrides[r.id];
    if (override === 'off') continue;

    const issues = r.test(app, screen);
    const effectiveSeverity = override ?? r.severity;
    for (const issue of issues) {
      issue.severity = effectiveSeverity;
      allIssues.push(issue);
    }
  }

  // Build layout
  const layout = buildLayoutData(app, screen);

  // Summary
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  const infos = allIssues.filter(i => i.severity === 'info');

  const lines: string[] = [];
  lines.push(`Scene: ${layout.sceneId} (${layout.sceneType}) | Screen: ${screen.width}x${screen.height}`);
  lines.push(`Interactive: ${layout.interactiveNodes.length} | Modals: ${layout.modals.length}`);
  lines.push('');

  if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
    lines.push('✓ All 26 checks passed.');
  } else {
    if (errors.length > 0) {
      lines.push(`✗ Errors (${errors.length}):`);
      for (const e of errors) lines.push(`  [${e.rule}] ${e.nodePath}: ${e.message}`);
    }
    if (warnings.length > 0) {
      lines.push(`⚠ Warnings (${warnings.length}):`);
      for (const w of warnings) lines.push(`  [${w.rule}] ${w.nodePath}: ${w.message}`);
    }
    if (infos.length > 0) {
      lines.push(`ℹ Info (${infos.length}):`);
      for (const i of infos) lines.push(`  [${i.rule}] ${i.nodePath}: ${i.message}`);
    }
  }

  const pass = options?.strict
    ? errors.length === 0 && warnings.length === 0
    : errors.length === 0;

  return { pass, issues: allIssues, summary: lines.join('\n'), layout };
}

// ══════════════════════════════════════════
// auditAll — batch audit multiple scenes
// ══════════════════════════════════════════

export interface AuditSceneEntry {
  /** Scene instance to audit */
  scene: SceneNode;
  /** Human-readable label for reports */
  label: string;
  /** Optional setup after scene enters (e.g. tap pause button) */
  setup?: (app: App) => void;
}

export interface AuditAllResult {
  allPassed: boolean;
  sceneCount: number;
  perScene: Map<string, AuditResult>;
  summary: string;
}

export async function auditAll(app: App, entries: AuditSceneEntry[], options?: AuditOptions): Promise<AuditAllResult> {
  const perScene = new Map<string, AuditResult>();
  const summaryLines: string[] = [];

  for (const entry of entries) {
    await app.router.replace(entry.scene);
    app.tick(16);
    if (entry.setup) entry.setup(app);
    app.tick(16);

    const result = auditUX(app, options);
    perScene.set(entry.label, result);

    const status = result.pass ? '✓' : '✗';
    const errorCount = result.issues.filter(i => i.severity === 'error').length;
    const warnCount = result.issues.filter(i => i.severity === 'warning').length;
    summaryLines.push(`${status} ${entry.label}: ${errorCount} errors, ${warnCount} warnings`);
  }

  const allPassed = [...perScene.values()].every(r => r.pass);

  summaryLines.unshift(`Audited ${entries.length} scenes — ${allPassed ? 'ALL PASSED' : 'FAILED'}`);
  summaryLines.unshift('');

  return { allPassed, sceneCount: entries.length, perScene, summary: summaryLines.join('\n') };
}
