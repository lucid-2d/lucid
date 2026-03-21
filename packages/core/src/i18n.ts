/**
 * I18n — minimal internationalization for game text.
 *
 * ```typescript
 * const i18n = new I18n({
 *   en: { play: 'Play', score: 'Score: {0}' },
 *   zh: { play: '开始', score: '得分: {0}' },
 * });
 *
 * i18n.locale = 'zh';
 * i18n.t('play');          // '开始'
 * i18n.t('score', 100);    // '得分: 100'
 * ```
 */

export type Translations = Record<string, string>;
export type LocaleMap = Record<string, Translations>;

export class I18n {
  private _locales: LocaleMap;
  private _locale: string;
  private _fallback: string;

  constructor(locales: LocaleMap, defaultLocale?: string) {
    this._locales = locales;
    const keys = Object.keys(locales);
    this._locale = defaultLocale ?? keys[0] ?? 'en';
    this._fallback = keys[0] ?? 'en';
  }

  /** Current locale */
  get locale(): string { return this._locale; }
  set locale(v: string) { this._locale = v; }

  /** Available locale codes */
  get locales(): string[] { return Object.keys(this._locales); }

  /** Add or merge translations for a locale */
  add(locale: string, translations: Translations): void {
    if (!this._locales[locale]) {
      this._locales[locale] = {};
    }
    Object.assign(this._locales[locale], translations);
  }

  /**
   * Translate a key. Supports positional params: {0}, {1}, etc.
   *
   * Falls back to: current locale → fallback locale → key itself.
   */
  t(key: string, ...args: any[]): string {
    let text = this._locales[this._locale]?.[key]
            ?? this._locales[this._fallback]?.[key]
            ?? key;

    // Replace {0}, {1}, etc.
    if (args.length > 0) {
      for (let i = 0; i < args.length; i++) {
        text = text.replace(`{${i}}`, String(args[i]));
      }
    }

    return text;
  }

  /** Check if a key exists in current or fallback locale */
  has(key: string): boolean {
    return key in (this._locales[this._locale] ?? {})
        || key in (this._locales[this._fallback] ?? {});
  }
}
