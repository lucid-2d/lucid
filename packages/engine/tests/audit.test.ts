/**
 * auditUX — UX audit engine tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from '../src/test-utils';
import { auditUX, auditAll, defineRule } from '../src/audit';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

// ── Helpers ──

function makeScene(id: string, opts?: any) {
  return new SceneNode({ id, width: 390, height: 844, ...opts });
}

function addButton(parent: UINode, id: string, x: number, y: number, w = 100, h = 48, text = id) {
  // Simulate a Button component ($type = 'Button')
  const btn = new UINode({ id, x, y, width: w, height: h, interactive: true });
  Object.defineProperty(btn, '$type', { get: () => 'Button' });
  Object.defineProperty(btn, '$text', { get: () => text });
  parent.addChild(btn);
  return btn;
}

function addLabel(parent: UINode, id: string, text: string, fontSize = 16) {
  const lbl = new UINode({ id, width: 200, height: 30 });
  Object.defineProperty(lbl, '$type', { get: () => 'Label' });
  Object.defineProperty(lbl, '$text', { get: () => text });
  (lbl as any).fontSize = fontSize;
  parent.addChild(lbl);
  return lbl;
}

function addModal(parent: UINode, id: string, visible = false) {
  const modal = new UINode({ id, width: 300, height: 400, visible });
  Object.defineProperty(modal, '$type', { get: () => 'Modal' });
  (modal as any).open = () => { modal.visible = true; };
  (modal as any).close = () => { modal.visible = false; };
  // Add default close button
  addButton(modal, 'modal-close', 250, 5, 40, 30, '×');
  parent.addChild(modal);
  return modal;
}

// ══════════════════════════════════════════
// Error Rules
// ══════════════════════════════════════════

describe('rule: touch-target-minimum', () => {
  it('flags interactive node smaller than 44x44', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'tiny', 10, 10, 30, 30, 'X');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    const issue = result.issues.find(i => i.rule === 'touch-target-minimum');
    expect(issue).toBeDefined();
    expect(issue!.nodeId).toBe('tiny');
  });

  it('passes for 44x44 node', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'ok', 10, 10, 44, 44, 'OK');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'touch-target-minimum')).toBeUndefined();
  });
});

describe('rule: button-within-bounds', () => {
  it('flags button outside screen', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'offscreen', 350, 10, 100, 48, 'Off');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'button-within-bounds')).toBeDefined();
  });

  it('passes for button inside screen', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'inside', 10, 10, 100, 48, 'In');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'button-within-bounds')).toBeUndefined();
  });
});

describe('rule: must-use-components', () => {
  it('flags raw UINode with interactive', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    const raw = new UINode({ id: 'raw-btn', x: 10, y: 10, width: 100, height: 48, interactive: true });
    scene.addChild(raw);
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'must-use-components')).toBeDefined();
  });

  it('passes Button component', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'btn', 10, 10, 100, 48, 'OK');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'must-use-components')).toBeUndefined();
  });
});

describe('rule: no-dead-end', () => {
  it('flags scene with no interactive nodes', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-dead-end')).toBeDefined();
  });

  it('passes with at least one button', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 100, 400, 200, 48, '开始游戏');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-dead-end')).toBeUndefined();
  });
});

describe('rule: scene-has-exit', () => {
  it('flags non-menu scene without exit button', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    addButton(scene, 'shoot', 100, 400, 200, 48, '射击');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'scene-has-exit')).toBeDefined();
  });

  it('passes when pause button exists', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    addButton(scene, 'pause', 340, 10, 44, 44, '⏸');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'scene-has-exit')).toBeUndefined();
  });

  it('skips menu scene', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'scene-has-exit')).toBeUndefined();
  });
});

describe('rule: menu-has-settings', () => {
  it('flags menu without settings', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 100, 400, 200, 48, '开始');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'menu-has-settings')).toBeDefined();
  });

  it('passes when settings button exists', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 100, 400, 200, 48, '开始');
    addButton(scene, 'settings', 100, 500, 200, 48, '设置');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'menu-has-settings')).toBeUndefined();
  });
});

describe('rule: modal-has-close', () => {
  it('passes for Modal with close button', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addModal(scene, 'dialog', true);
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'modal-has-close')).toBeUndefined();
  });

  it('flags Modal without close button', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    const modal = new UINode({ id: 'bad-modal', width: 300, height: 400, visible: true });
    Object.defineProperty(modal, '$type', { get: () => 'Modal' });
    (modal as any).open = () => {};
    (modal as any).close = () => {};
    // No close button added
    scene.addChild(modal);
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'modal-has-close')).toBeDefined();
  });
});

describe('rule: result-scene-has-actions', () => {
  it('flags result scene without actions', () => {
    const app = createTestApp();
    const scene = makeScene('result');
    addLabel(scene, 'score', 'Score: 100');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'result-scene-has-actions')).toBeDefined();
  });

  it('passes with retry button', () => {
    const app = createTestApp();
    const scene = makeScene('result');
    addButton(scene, 'retry', 100, 500, 200, 48, '再来一局');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'result-scene-has-actions')).toBeUndefined();
  });
});

describe('rule: no-overlap', () => {
  it('detects overlapping siblings', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'a', 50, 100, 100, 48, 'A');
    addButton(scene, 'b', 100, 100, 100, 48, 'B'); // overlaps with A
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-overlap')).toBeDefined();
  });

  it('no issue for non-overlapping siblings', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'a', 50, 100, 100, 48, 'A');
    addButton(scene, 'b', 50, 200, 100, 48, 'B');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-overlap')).toBeUndefined();
  });
});

// ══════════════════════════════════════════
// Warning Rules
// ══════════════════════════════════════════

describe('rule: no-emoji', () => {
  it('flags text with emoji', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'emoji-btn', 10, 10, 100, 48, '📅 签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-emoji')).toBeDefined();
  });

  it('passes for plain text', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'clean', 10, 10, 100, 48, '签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-emoji')).toBeUndefined();
  });
});

describe('rule: button-has-text', () => {
  it('flags button without text', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'empty', 10, 10, 100, 48, '');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'button-has-text')).toBeDefined();
  });
});

describe('rule: font-size-minimum', () => {
  it('flags label with fontSize < 10', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addLabel(scene, 'tiny-text', 'small', 8);
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'font-size-minimum')).toBeDefined();
  });
});

describe('rule: text-contrast', () => {
  it('flags text with low alpha', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    const lbl = addLabel(scene, 'faded', 'Ghost text');
    lbl.alpha = 0.2;
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'text-contrast')).toBeDefined();
  });
});

describe('rule: menu-has-privacy', () => {
  it('flags menu without privacy', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 100, 400, 200, 48, '开始');
    addButton(scene, 'settings', 100, 500, 200, 48, '设置');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'menu-has-privacy')).toBeDefined();
  });
});

describe('rule: game-scene-has-pause', () => {
  it('flags gameplay scene without pause', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    addButton(scene, 'shoot', 100, 400, 200, 48, '射击');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'game-scene-has-pause')).toBeDefined();
  });
});

describe('rule: touch-target-recommended', () => {
  it('warns for 44x44 (below recommended 48)', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'small-ok', 10, 10, 44, 44, 'OK');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'touch-target-recommended')).toBeDefined();
  });
});

// ══════════════════════════════════════════
// Options & Features
// ══════════════════════════════════════════

describe('auditUX options', () => {
  it('ignore skips specified rules', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app, { ignore: ['no-dead-end', 'scene-has-exit', 'game-scene-has-pause'] });
    expect(result.issues.find(i => i.rule === 'no-dead-end')).toBeUndefined();
    expect(result.issues.find(i => i.rule === 'scene-has-exit')).toBeUndefined();
  });

  it('rules.off turns off a rule', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'emoji', 10, 10, 100, 48, '📅 签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app, { rules: { 'no-emoji': 'off' } });
    expect(result.issues.find(i => i.rule === 'no-emoji')).toBeUndefined();
  });

  it('rules severity override changes issue severity', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'emoji', 10, 10, 100, 48, '📅 签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app, { rules: { 'no-emoji': 'error' } });
    const issue = result.issues.find(i => i.rule === 'no-emoji');
    expect(issue?.severity).toBe('error');
  });

  it('scene auditSkip is respected', () => {
    const app = createTestApp();
    class SkipScene extends SceneNode {
      static auditSkip = ['no-dead-end'];
    }
    const scene = new SkipScene({ id: 'play', width: 390, height: 844 });
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'no-dead-end')).toBeUndefined();
  });
});

describe('layout data', () => {
  it('includes sceneId and sceneType', () => {
    const app = createTestApp();
    app.router.push(makeScene('menu'));
    app.tick(16);

    const result = auditUX(app);
    expect(result.layout.sceneId).toBe('menu');
    expect(result.layout.sceneType).toBe('menu');
  });

  it('lists interactive nodes with bounds and zone', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.layout.interactiveNodes.length).toBeGreaterThan(0);
    const playNode = result.layout.interactiveNodes.find(n => n.id === 'play');
    expect(playNode).toBeDefined();
    expect(playNode!.bounds.w).toBe(200);
    expect(playNode!.zone).toBe('center');
  });

  it('lists modals', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addModal(scene, 'settings', false);
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.layout.modals.length).toBe(1);
    expect(result.layout.modals[0].id).toBe('settings');
  });
});

describe('summary', () => {
  it('reports pass: true when no errors', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.pass).toBe(true);
  });

  it('reports pass: false when errors exist', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.pass).toBe(false);
  });

  it('summary text includes error counts', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.summary).toContain('Errors');
  });
});

describe('rule: exit-button-position', () => {
  it('does not flag buttons inside Modal', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    addButton(scene, 'pause-btn', 340, 10, 44, 44, '⏸');
    const modal = addModal(scene, 'pause-modal', true);
    addButton(modal, 'home-btn', 85, 200, 200, 48, '返回主页');
    addButton(modal, 'continue', 85, 260, 200, 48, '继续');
    addButton(modal, 'restart', 85, 320, 200, 48, '重新开始');
    addButton(modal, 'settings', 85, 380, 200, 48, '设置');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    const posIssues = result.issues.filter(i => i.rule === 'exit-button-position');
    // home-btn inside modal should NOT be flagged
    expect(posIssues.find(i => i.nodeId === 'home-btn')).toBeUndefined();
  });

  it('does not flag Modal container itself', () => {
    const app = createTestApp();
    const scene = makeScene('play');
    addButton(scene, 'pause-btn', 340, 10, 44, 44, '⏸');
    const modal = addModal(scene, 'pause-modal', true);
    addButton(modal, 'continue', 85, 260, 200, 48, '继续');
    addButton(modal, 'restart', 85, 320, 200, 48, '重新开始');
    addButton(modal, 'home', 85, 200, 200, 48, '主页');
    addButton(modal, 'settings', 85, 380, 200, 48, '设置');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    const posIssues = result.issues.filter(i => i.rule === 'exit-button-position');
    expect(posIssues.find(i => i.nodeId === 'pause-modal')).toBeUndefined();
  });
});

describe('strict mode', () => {
  it('pass=true when only warnings exist (non-strict)', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');
    addButton(scene, 'emoji-btn', 95, 700, 200, 48, '📅 签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.some(i => i.severity === 'warning')).toBe(true);
    expect(result.pass).toBe(true); // warnings don't fail in normal mode
  });

  it('pass=false when warnings exist (strict)', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');
    addButton(scene, 'emoji-btn', 95, 700, 200, 48, '📅 签到');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app, { strict: true });
    expect(result.pass).toBe(false); // warnings fail in strict mode
  });

  it('pass=true in strict when no errors and no warnings', () => {
    const app = createTestApp();
    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');
    app.router.push(scene);
    app.tick(16);

    const result = auditUX(app, { strict: true });
    expect(result.issues.filter(i => i.severity === 'error').length).toBe(0);
    expect(result.issues.filter(i => i.severity === 'warning').length).toBe(0);
    expect(result.pass).toBe(true);
  });
});

describe('auditAll', () => {
  it('audits multiple scenes and returns per-scene results', async () => {
    const app = createTestApp();

    const menuScene = makeScene('menu');
    addButton(menuScene, 'play', 95, 400, 200, 48, '开始');
    addButton(menuScene, 'settings', 95, 500, 200, 48, '设置');
    addButton(menuScene, 'privacy', 95, 600, 200, 48, '隐私协议');

    const playScene = makeScene('play');
    addButton(playScene, 'pause', 340, 10, 44, 44, '⏸');

    const results = await auditAll(app, [
      { scene: menuScene, label: 'menu' },
      { scene: playScene, label: 'play' },
    ]);

    expect(results.sceneCount).toBe(2);
    expect(results.perScene.size).toBe(2);
    expect(results.perScene.has('menu')).toBe(true);
    expect(results.perScene.has('play')).toBe(true);
  });

  it('allPassed is true when all scenes pass', async () => {
    const app = createTestApp();

    const menuScene = makeScene('menu');
    addButton(menuScene, 'play', 95, 400, 200, 48, '开始');
    addButton(menuScene, 'settings', 95, 500, 200, 48, '设置');
    addButton(menuScene, 'privacy', 95, 600, 200, 48, '隐私协议');

    const results = await auditAll(app, [
      { scene: menuScene, label: 'menu' },
    ]);

    expect(results.allPassed).toBe(true);
  });

  it('allPassed is false when any scene fails', async () => {
    const app = createTestApp();

    const menuScene = makeScene('menu');
    addButton(menuScene, 'play', 95, 400, 200, 48, '开始');
    addButton(menuScene, 'settings', 95, 500, 200, 48, '设置');
    addButton(menuScene, 'privacy', 95, 600, 200, 48, '隐私协议');

    const emptyScene = makeScene('play'); // no buttons → no-dead-end error

    const results = await auditAll(app, [
      { scene: menuScene, label: 'menu' },
      { scene: emptyScene, label: 'play' },
    ]);

    expect(results.allPassed).toBe(false);
    expect(results.perScene.get('menu')!.pass).toBe(true);
    expect(results.perScene.get('play')!.pass).toBe(false);
  });

  it('setup callback is called before audit', async () => {
    const app = createTestApp();

    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');

    let setupCalled = false;
    const results = await auditAll(app, [
      { scene, label: 'menu', setup: () => { setupCalled = true; } },
    ]);

    expect(setupCalled).toBe(true);
    expect(results.sceneCount).toBe(1);
  });

  it('passes options through to auditUX', async () => {
    const app = createTestApp();

    const scene = makeScene('menu');
    addButton(scene, 'play', 95, 400, 200, 48, '开始');
    addButton(scene, 'settings', 95, 500, 200, 48, '设置');
    addButton(scene, 'privacy', 95, 600, 200, 48, '隐私协议');
    addButton(scene, 'emoji', 95, 700, 200, 48, '📅 签到');

    const results = await auditAll(app, [
      { scene, label: 'menu' },
    ], { strict: true });

    // strict mode → warnings fail
    expect(results.allPassed).toBe(false);
  });

  it('summary includes scene count', async () => {
    const app = createTestApp();

    const s1 = makeScene('menu');
    addButton(s1, 'play', 95, 400, 200, 48, '开始');
    addButton(s1, 'settings', 95, 500, 200, 48, '设置');
    addButton(s1, 'privacy', 95, 600, 200, 48, '隐私协议');

    const s2 = makeScene('result');
    addButton(s2, 'retry', 95, 400, 200, 48, '再来一局');

    const results = await auditAll(app, [
      { scene: s1, label: 'menu' },
      { scene: s2, label: 'result' },
    ]);

    expect(results.summary).toContain('2 scenes');
  });
});

describe('defineRule', () => {
  it('custom rule is executed and results appear in issues', () => {
    defineRule({
      id: 'test-custom-rule',
      severity: 'warning',
      test: (app) => {
        return [{ rule: 'test-custom-rule', severity: 'warning', nodeId: 'root', nodePath: 'root', message: 'Custom check' }];
      },
    });

    const app = createTestApp();
    app.router.push(makeScene('menu'));
    app.tick(16);

    const result = auditUX(app);
    expect(result.issues.find(i => i.rule === 'test-custom-rule')).toBeDefined();
  });
});
