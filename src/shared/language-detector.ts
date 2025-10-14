import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from './constants';

export type DetectableLanguage = SupportedLanguageCode | 'auto';

export interface TranslationDirection {
  source: DetectableLanguage;
  target: DetectableLanguage;
}

export class LanguageDetector {
  private readonly languagePatterns: Partial<Record<SupportedLanguageCode, RegExp>>;

  constructor() {
    this.languagePatterns = {
      'zh-CN': /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      ar: /[\u0600-\u06ff]/,
      ru: /[\u0400-\u04ff]/,
      hi: /[\u0900-\u097f]/,
      en: /^[a-zA-Z\s.,!?;:'"()-]+$/
    };
  }

  detectLanguage(text: string | null | undefined): DetectableLanguage {
    if (!text || typeof text !== 'string') {
      return 'auto';
    }

    const cleanText = text.trim();
    if (cleanText.length === 0) {
      return 'auto';
    }

    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern && pattern.test(cleanText)) {
        return lang as SupportedLanguageCode;
      }
    }

    return 'auto';
  }

  getTranslationDirection(detectedLang: DetectableLanguage, userTargetLang: DetectableLanguage): TranslationDirection | null {
    if (detectedLang === 'auto' || detectedLang === userTargetLang) {
      return null;
    }

    return {
      source: detectedLang,
      target: userTargetLang
    };
  }

  isMultilingual(text: string | null | undefined): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const detectedLanguages = new Set<SupportedLanguageCode>();

    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern && pattern.test(text)) {
        detectedLanguages.add(lang as SupportedLanguageCode);
      }
    }

    return detectedLanguages.size > 1;
  }

  getPrimaryLanguage(text: string | null | undefined): DetectableLanguage {
    if (!text || typeof text !== 'string') {
      return 'auto';
    }

    const cleanText = text.trim();
    if (cleanText.length === 0) {
      return 'auto';
    }

    const priorityOrder: SupportedLanguageCode[] = ['zh-CN', 'ja', 'ko', 'ar', 'ru', 'hi', 'en'];

    for (const lang of priorityOrder) {
      if (this.languagePatterns[lang]?.test(cleanText)) {
        return lang;
      }
    }

    return 'auto';
  }

  isValidLanguageCode(langCode: string): boolean {
    return langCode === 'auto' || Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, langCode);
  }
}
