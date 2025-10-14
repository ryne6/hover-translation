export const SUPPORTED_LANGUAGES = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  ru: 'Русский',
  it: 'Italiano',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी'
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const TRANSLATION_PROVIDERS = {
  GOOGLE: 'google',
  BAIDU: 'baidu',
  DEEPL: 'deepl',
  MICROSOFT: 'microsoft',
  YOUDAO: 'youdao',
  TENCENT: 'tencent',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GEMINI: 'gemini'
} as const;

export type TranslationProviderId = typeof TRANSLATION_PROVIDERS[keyof typeof TRANSLATION_PROVIDERS];

export interface ShortcutSettings {
  toggle: string;
  copy: string;
}

export interface LegacyDefaultSettings {
  targetLanguage: SupportedLanguageCode;
  sourceLanguage: 'auto' | SupportedLanguageCode;
  translationProvider: TranslationProviderId;
  theme: 'light' | 'dark' | string;
  shortcuts: ShortcutSettings;
  autoDetect: boolean;
  showOriginal: boolean;
  showTranslated: boolean;
}

export const DEFAULT_SETTINGS: LegacyDefaultSettings = {
  targetLanguage: 'zh-CN',
  sourceLanguage: 'auto',
  translationProvider: TRANSLATION_PROVIDERS.GOOGLE,
  theme: 'light',
  shortcuts: {
    toggle: 'Ctrl+Shift+T',
    copy: 'Ctrl+C'
  },
  autoDetect: true,
  showOriginal: true,
  showTranslated: true
};

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export const API_CONFIG: Record<'GOOGLE' | 'BAIDU', ApiConfig> = {
  GOOGLE: {
    baseUrl: 'https://translation.googleapis.com/language/translate/v2',
    timeout: 5000
  },
  BAIDU: {
    baseUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    timeout: 5000
  }
};

export const CACHE_CONFIG = {
  MAX_SIZE: 1000,
  TTL: 24 * 60 * 60 * 1000
} as const;

export const EVENTS = {
  TEXT_SELECTED: 'textSelected',
  SELECTION_CLEARED: 'selectionCleared',
  TRANSLATION_COMPLETE: 'translationComplete',
  TRANSLATION_ERROR: 'translationError',
  SETTINGS_UPDATED: 'settingsUpdated'
} as const;

export const STORAGE_KEYS = {
  SETTINGS: 'hoverTranslationSettings',
  HISTORY: 'translationHistory',
  CACHE: 'translationCache'
} as const;
