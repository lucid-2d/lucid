import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { Button } from '@lucid-2d/ui';
import { TutorialOverlay, showTutorial } from '../src/tutorial-overlay';

function makeScene(): UINode {
  const scene = new UINode({ id: 'scene', width: 390, height: 844 });
  const playBtn = new Button({ id: 'play', text: '开始游戏', variant: 'primary', width: 200, height: 50 });
  playBtn.x = 95;
  playBtn.y = 400;
  scene.addChild(playBtn);

  const shopBtn = new Button({ id: 'shop', text: '商店', variant: 'secondary', width: 200, height: 50 });
  shopBtn.x = 95;
  shopBtn.y = 470;
  scene.addChild(shopBtn);

  return scene;
}

describe('TutorialOverlay', () => {
  it('starts at step 0', () => {
    const scene = makeScene();
    const tut = new TutorialOverlay(scene, {
      steps: [
        { targetId: 'play', text: '点击开始' },
        { targetId: 'shop', text: '这是商店' },
      ],
      screenWidth: 390,
      screenHeight: 844,
    });
    scene.addChild(tut);
    expect(tut.currentStep).toBe(0);
    expect(tut.totalSteps).toBe(2);
  });

  it('nextStep advances and emits step event', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [
        { targetId: 'play', text: '点击开始' },
        { targetId: 'shop', text: '这是商店' },
      ],
    });
    let stepIdx = -1;
    tut.$on('step', (i: number) => { stepIdx = i; });

    tut.nextStep();
    expect(tut.currentStep).toBe(1);
    expect(stepIdx).toBe(1);
  });

  it('nextStep on last step emits complete and removes overlay', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [
        { targetId: 'play', text: '点击开始' },
      ],
    });
    let completed = false;
    tut.$on('complete', () => { completed = true; });

    tut.nextStep();
    expect(completed).toBe(true);
    expect(scene.findById('tutorial-overlay')).toBeNull();
  });

  it('skip emits skip event and removes overlay', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [
        { targetId: 'play', text: '点击开始' },
        { targetId: 'shop', text: '这是商店' },
      ],
    });
    let skipped = false;
    tut.$on('skip', () => { skipped = true; });

    tut.skip();
    expect(skipped).toBe(true);
    expect(scene.findById('tutorial-overlay')).toBeNull();
  });

  it('has next and skip buttons', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [{ targetId: 'play', text: '点击开始' }],
    });
    expect(tut.findById('tutorial-next')).toBeDefined();
    expect(tut.findById('tutorial-skip')).toBeDefined();
  });

  it('skip button hidden when allowSkip=false', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [{ targetId: 'play', text: '点击开始' }],
      allowSkip: false,
    });
    expect(tut.findById('tutorial-skip')).toBeNull();
  });

  it('last step button text is 知道了', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [{ targetId: 'play', text: '点击开始' }],
    });
    expect(tut.findById('tutorial-next')!.$text).toBe('知道了');
  });

  it('multi-step: first step button text is 下一步', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [
        { targetId: 'play', text: '步骤1' },
        { targetId: 'shop', text: '步骤2' },
      ],
    });
    expect(tut.findById('tutorial-next')!.$text).toBe('下一步');
  });

  it('hitTest blocks non-target area', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [{ targetId: 'play', text: '点击开始' }],
    });
    // Hit on empty area → should return overlay (blocked)
    const hit = scene.hitTest(10, 10);
    expect(hit?.id).toBe('tutorial-overlay');
  });

  it('$text shows step progress', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [
        { targetId: 'play', text: '步骤1' },
        { targetId: 'shop', text: '步骤2' },
      ],
    });
    expect(tut.$text).toBe('Tutorial 1/2');
    tut.nextStep();
    expect(tut.$text).toBe('Tutorial 2/2');
  });

  it('handles missing target gracefully', () => {
    const scene = makeScene();
    const tut = showTutorial(scene, {
      steps: [{ targetId: 'nonexistent', text: '不存在' }],
    });
    // Should not throw, just no highlight
    expect(tut.currentStep).toBe(0);
  });
});
