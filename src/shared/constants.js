// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ru': 'Русский',
  'it': 'Italiano',
  'pt': 'Português',
  'ar': 'العربية',
  'hi': 'हिन्दी'
};

// 翻译服务提供商
export const TRANSLATION_PROVIDERS = {
  GOOGLE: 'google',
  BAIDU: 'baidu'
};

// 默认设置
export const DEFAULT_SETTINGS = {
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

// API 配置
export const API_CONFIG = {
  GOOGLE: {
    baseUrl: 'https://translation.googleapis.com/language/translate/v2',
    timeout: 5000
  },
  BAIDU: {
    baseUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    timeout: 5000
  }
};

// 缓存配置
export const CACHE_CONFIG = {
  MAX_SIZE: 1000,
  TTL: 24 * 60 * 60 * 1000 // 24小时
};

// 事件类型
export const EVENTS = {
  TEXT_SELECTED: 'textSelected',
  SELECTION_CLEARED: 'selectionCleared',
  TRANSLATION_COMPLETE: 'translationComplete',
  TRANSLATION_ERROR: 'translationError',
  SETTINGS_UPDATED: 'settingsUpdated'
};

// 存储键名
export const STORAGE_KEYS = {
  SETTINGS: 'hoverTranslationSettings',
  HISTORY: 'translationHistory',
  CACHE: 'translationCache'
};