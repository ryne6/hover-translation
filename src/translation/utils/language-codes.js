/**
 * 常用语言代码和名称映射
 */
export const COMMON_LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', nativeName: '自动检测' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

/**
 * 获取语言名称
 * @param {string} code - 语言代码
 * @returns {string} 语言名称
 */
export function getLanguageName(code) {
  const lang = COMMON_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : code.toUpperCase();
}

/**
 * 获取本地语言名称
 * @param {string} code - 语言代码
 * @returns {string} 本地语言名称
 */
export function getNativeLanguageName(code) {
  const lang = COMMON_LANGUAGES.find(l => l.code === code);
  return lang ? lang.nativeName : code.toUpperCase();
}

/**
 * 检查语言代码是否有效
 * @param {string} code - 语言代码
 * @returns {boolean}
 */
export function isValidLanguageCode(code) {
  return COMMON_LANGUAGES.some(l => l.code === code);
}
