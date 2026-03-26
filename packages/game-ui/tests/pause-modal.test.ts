import { describe, it, expect } from 'vitest';
import { UINode } from '@lucid-2d/core';
import { PauseModal } from '../src/pause-modal';

describe('PauseModal', () => {
  it('creates with required props', () => {
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
    });
    expect(modal.id).toBe('pause-modal');
    expect(modal.findById('resume')).toBeDefined();
    expect(modal.findById('restart')).toBeDefined();
    expect(modal.findById('home')).toBeDefined();
  });

  it('resume button triggers callback and event', () => {
    let resumed = false;
    let eventFired = false;
    const modal = new PauseModal({
      resume: () => { resumed = true; },
      restart: () => {},
      home: () => {},
    });
    modal.$on('resume', () => { eventFired = true; });

    modal.findById('resume')!.$emit('tap');
    expect(resumed).toBe(true);
    expect(eventFired).toBe(true);
  });

  it('restart button triggers callback', () => {
    let restarted = false;
    const modal = new PauseModal({
      resume: () => {},
      restart: () => { restarted = true; },
      home: () => {},
    });

    modal.findById('restart')!.$emit('tap');
    expect(restarted).toBe(true);
  });

  it('home button triggers callback', () => {
    let wentHome = false;
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => { wentHome = true; },
    });

    modal.findById('home')!.$emit('tap');
    expect(wentHome).toBe(true);
  });

  it('no settings button without settings config', () => {
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
    });
    expect(modal.findById('pause-settings')).toBeNull();
  });

  it('shows settings button when settings provided', () => {
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
      settings: {
        toggles: [{ id: 'sound', label: '音效', value: true }],
        onToggle: () => {},
      },
    });
    expect(modal.findById('pause-settings')).toBeDefined();
  });

  it('no quit button without quit config', () => {
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
    });
    expect(modal.findById('quit')).toBeNull();
  });

  it('quit button triggers callback', () => {
    let quitted = false;
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
      quit: () => { quitted = true; },
    });

    const btn = modal.findById('quit');
    expect(btn).toBeDefined();
    btn!.$emit('tap');
    expect(quitted).toBe(true);
  });

  it('settings button opens settings panel', () => {
    const owner = new UINode({ id: 'owner', width: 390, height: 844 });
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
      settings: {
        toggles: [{ id: 'sound', label: '音效', value: true }],
        onToggle: () => {},
      },
    });
    modal.attachTo(owner);
    owner.addChild(modal);

    // Open settings
    modal.findById('pause-settings')!.$emit('tap');
    expect(owner.findById('settings-modal')).toBeDefined();

    // Tap again to close
    modal.findById('pause-settings')!.$emit('tap');
    expect(owner.findById('settings-modal')).toBeNull();
  });

  it('settings panel close event removes it', () => {
    const owner = new UINode({ id: 'owner', width: 390, height: 844 });
    const modal = new PauseModal({
      resume: () => {},
      restart: () => {},
      home: () => {},
      settings: {
        toggles: [{ id: 'sound', label: '音效', value: true }],
        onToggle: () => {},
      },
    });
    modal.attachTo(owner);
    owner.addChild(modal);

    modal.findById('pause-settings')!.$emit('tap');
    const panel = owner.findById('settings-modal')!;
    panel.$emit('close');
    expect(owner.findById('settings-modal')).toBeNull();
  });
});
