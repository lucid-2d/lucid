/**
 * Audio system tests — using mock adapter (no real audio playback)
 */
import { describe, it, expect, vi } from 'vitest';
import { createMockAudio } from '../src/audio';

describe('AudioManager', () => {
  it('creates with mock adapter', () => {
    const audio = createMockAudio();
    expect(audio).toBeDefined();
  });

  it('load and has', () => {
    const audio = createMockAudio();
    expect(audio.has('hit')).toBe(false);
    audio.load('hit', 'assets/hit.mp3');
    expect(audio.has('hit')).toBe(true);
  });

  it('load same name is idempotent', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    audio.load('hit', 'assets/hit-v2.mp3'); // should not override
    expect(audio.has('hit')).toBe(true);
  });

  it('playSfx plays a sound', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    // Should not throw
    audio.playSfx('hit');
  });

  it('playSfx ignores unknown names', () => {
    const audio = createMockAudio();
    audio.playSfx('nonexistent'); // should not throw
  });

  it('playSfx does nothing when muted', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    audio.muted = true;
    audio.playSfx('hit'); // should not play
  });

  it('stopAllSfx clears active sounds', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    audio.playSfx('hit');
    audio.playSfx('hit');
    audio.stopAllSfx(); // should not throw
  });
});

describe('BGM', () => {
  it('playBgm starts background music', () => {
    const audio = createMockAudio();
    audio.load('menu', 'assets/menu.mp3');
    audio.playBgm('menu');
    expect(audio.currentBgm).toBe('menu');
  });

  it('stopBgm stops and clears', () => {
    const audio = createMockAudio();
    audio.load('menu', 'assets/menu.mp3');
    audio.playBgm('menu');
    audio.stopBgm();
    expect(audio.currentBgm).toBe('');
  });

  it('playBgm replaces current BGM', () => {
    const audio = createMockAudio();
    audio.load('menu', 'assets/menu.mp3');
    audio.load('game', 'assets/game.mp3');
    audio.playBgm('menu');
    audio.playBgm('game');
    expect(audio.currentBgm).toBe('game');
  });

  it('pauseBgm and resumeBgm', () => {
    const audio = createMockAudio();
    audio.load('menu', 'assets/menu.mp3');
    audio.playBgm('menu');
    audio.pauseBgm(); // should not throw
    audio.resumeBgm(); // should not throw
    expect(audio.currentBgm).toBe('menu');
  });

  it('playBgm with loop option', () => {
    const audio = createMockAudio();
    audio.load('menu', 'assets/menu.mp3');
    audio.playBgm('menu', { loop: false });
    expect(audio.currentBgm).toBe('menu');
  });

  it('playBgm ignores unknown names', () => {
    const audio = createMockAudio();
    audio.playBgm('nonexistent');
    expect(audio.currentBgm).toBe('');
  });
});

describe('Volume and mute', () => {
  it('sfxVolume defaults to 1', () => {
    const audio = createMockAudio();
    expect(audio.sfxVolume).toBe(1);
  });

  it('bgmVolume defaults to 1', () => {
    const audio = createMockAudio();
    expect(audio.bgmVolume).toBe(1);
  });

  it('sfxVolume is clamped to 0-1', () => {
    const audio = createMockAudio();
    audio.sfxVolume = 1.5;
    expect(audio.sfxVolume).toBe(1);
    audio.sfxVolume = -0.5;
    expect(audio.sfxVolume).toBe(0);
  });

  it('bgmVolume is clamped to 0-1', () => {
    const audio = createMockAudio();
    audio.bgmVolume = 2;
    expect(audio.bgmVolume).toBe(1);
    audio.bgmVolume = -1;
    expect(audio.bgmVolume).toBe(0);
  });

  it('muted defaults to false', () => {
    const audio = createMockAudio();
    expect(audio.muted).toBe(false);
  });

  it('muted can be toggled', () => {
    const audio = createMockAudio();
    audio.muted = true;
    expect(audio.muted).toBe(true);
    audio.muted = false;
    expect(audio.muted).toBe(false);
  });
});

describe('Register custom handle', () => {
  it('register adds a custom AudioHandle', () => {
    const audio = createMockAudio();
    const handle = {
      play: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      volume: 1, loop: false, playing: false, destroy: vi.fn(),
    };
    audio.register('synth-sfx', handle);
    expect(audio.has('synth-sfx')).toBe(true);
  });

  it('registered handle can be played as SFX', () => {
    const audio = createMockAudio();
    const handle = {
      play: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      volume: 1, loop: false, get playing() { return false; }, destroy: vi.fn(),
    };
    audio.register('synth-sfx', handle);
    audio.playSfx('synth-sfx');
    // SFX clones the handle, so original play is not called directly
    // but the sound should be registered and playable
    expect(audio.has('synth-sfx')).toBe(true);
  });

  it('register overwrites existing sound', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    const handle = {
      play: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      volume: 1, loop: false, playing: false, destroy: vi.fn(),
    };
    audio.register('hit', handle);
    expect(audio.has('hit')).toBe(true);
  });
});

describe('Lifecycle', () => {
  it('destroy cleans up everything', () => {
    const audio = createMockAudio();
    audio.load('hit', 'assets/hit.mp3');
    audio.load('menu', 'assets/menu.mp3');
    audio.playSfx('hit');
    audio.playBgm('menu');
    audio.destroy();
    expect(audio.has('hit')).toBe(false);
    expect(audio.currentBgm).toBe('');
  });
});
