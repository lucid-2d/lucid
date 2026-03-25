import { createTestApp } from './packages/engine/src/test-utils';
import { createScene } from './packages/game-ui/src/templates/create-scene';

const app = createTestApp({ render: true });

const menu = createScene(app as any, {
  template: 'menu',
  title: '珠链尖塔',
  play: () => {},
  settings: {
    toggles: [{ id: 'bgm', label: '背景音乐', value: true }, { id: 'sfx', label: '音效', value: true }],
    onToggle: () => {},
  },
  privacy: { content: '珠链尖塔尊重您的隐私。本游戏不收集任何个人信息。游戏数据仅存储在您的设备本地。' },
});

app.router._skipTemplateValidation = true;
app.router.push(menu);
menu.onEnter();
app.tick(16);
app.renderOneFrame();
app.saveImage('/tmp/menu-default.png');
console.log('✓ Menu saved → /tmp/menu-default.png');

// Open privacy dialog
const privacyBtn = app.root.findById('privacy');
if (privacyBtn) {
  privacyBtn.$emit('tap');
  // Run several ticks for animation
  for (let i = 0; i < 20; i++) app.tick(16);
  app.renderOneFrame();
  app.saveImage('/tmp/privacy-dialog.png');
  console.log('✓ Privacy dialog saved → /tmp/privacy-dialog.png');
} else {
  console.log('✗ Privacy button not found!');
}

// Inspect tree
console.log('\nTree:');
console.log(app.root.$inspect());
