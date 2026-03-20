import { describe, it, expect, vi } from 'vitest';
import { SettingsPanel } from '../src/settings-panel';
import { Toggle } from '@lucid/ui';

describe('SettingsPanel', () => {
  const toggles = [
    { id: 'sound', label: '音效', value: true },
    { id: 'music', label: '音乐', value: true },
    { id: 'vibration', label: '振动', value: false },
  ];

  it('creates toggles as children', () => {
    const panel = new SettingsPanel({ toggles });
    const found = panel.findByType(Toggle);
    expect(found).toHaveLength(3);
  });

  it('emits toggle event with id and value', () => {
    const panel = new SettingsPanel({ toggles });
    const handler = vi.fn();
    panel.$on('toggle', handler);

    const soundToggle = panel.findById('toggle-sound');
    expect(soundToggle).not.toBeNull();
    // simulate tap on the toggle
    soundToggle!.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    soundToggle!.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });

    expect(handler).toHaveBeenCalledWith('sound', false);
  });

  it('emits link event', () => {
    const panel = new SettingsPanel({
      toggles: [],
      links: [{ id: 'privacy', label: '隐私协议' }],
    });
    const handler = vi.fn();
    panel.$on('link', handler);

    const link = panel.findById('link-privacy');
    link!.$emit('tap');
    expect(handler).toHaveBeenCalledWith('privacy');
  });

  it('shows version string', () => {
    const panel = new SettingsPanel({ toggles: [], version: 'v1.2.3' });
    expect(panel.$inspect()).toContain('v1.2.3');
  });
});
