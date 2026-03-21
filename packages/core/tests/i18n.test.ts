import { describe, it, expect } from 'vitest';
import { I18n } from '../src/i18n';

const locales = {
  en: { play: 'Play', score: 'Score: {0}', greeting: 'Hello, {0}! You have {1} coins.' },
  zh: { play: '开始', score: '得分: {0}', greeting: '你好, {0}! 你有 {1} 个金币。' },
  ja: { play: 'プレイ' },
};

describe('I18n', () => {
  it('translates key in current locale', () => {
    const i18n = new I18n(locales, 'en');
    expect(i18n.t('play')).toBe('Play');
  });

  it('switches locale', () => {
    const i18n = new I18n(locales, 'en');
    i18n.locale = 'zh';
    expect(i18n.t('play')).toBe('开始');
  });

  it('falls back to first locale for missing keys', () => {
    const i18n = new I18n(locales, 'ja');
    // 'score' not in ja, falls back to en (first locale)
    expect(i18n.t('score', 42)).toBe('Score: 42');
  });

  it('returns key itself if not found anywhere', () => {
    const i18n = new I18n(locales, 'en');
    expect(i18n.t('nonexistent')).toBe('nonexistent');
  });

  it('supports positional params', () => {
    const i18n = new I18n(locales, 'en');
    expect(i18n.t('score', 1280)).toBe('Score: 1280');
  });

  it('supports multiple params', () => {
    const i18n = new I18n(locales, 'zh');
    expect(i18n.t('greeting', '跳跳', 500)).toBe('你好, 跳跳! 你有 500 个金币。');
  });

  it('has() checks key existence', () => {
    const i18n = new I18n(locales, 'en');
    expect(i18n.has('play')).toBe(true);
    expect(i18n.has('nonexistent')).toBe(false);
  });

  it('locales returns available locale codes', () => {
    const i18n = new I18n(locales);
    expect(i18n.locales).toEqual(['en', 'zh', 'ja']);
  });

  it('add() merges translations', () => {
    const i18n = new I18n({ en: { a: 'A' } });
    i18n.add('en', { b: 'B' });
    expect(i18n.t('a')).toBe('A');
    expect(i18n.t('b')).toBe('B');
  });

  it('add() creates new locale', () => {
    const i18n = new I18n({ en: { play: 'Play' } });
    i18n.add('ko', { play: '놀다' });
    i18n.locale = 'ko';
    expect(i18n.t('play')).toBe('놀다');
  });

  it('defaults to first locale key', () => {
    const i18n = new I18n({ fr: { hi: 'Salut' }, en: { hi: 'Hi' } });
    expect(i18n.locale).toBe('fr');
    expect(i18n.t('hi')).toBe('Salut');
  });
});
