/**
 * 语言检测器
 */
export class LanguageDetector {
  constructor() {
    this.languagePatterns = {
      'zh-CN': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/,
      'ru': /[\u0400-\u04ff]/,
      'hi': /[\u0900-\u097f]/,
      'en': /^[a-zA-Z\s.,!?;:'"()-]+$/
    };
  }

  /**
   * 检测文本语言
   * @param {string} text 要检测的文本
   * @returns {string} 检测到的语言代码
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'auto';
    }

    const cleanText = text.trim();
    if (cleanText.length === 0) {
      return 'auto';
    }

    // 使用正则表达式检测
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(cleanText)) {
        return lang;
      }
    }

    // 如果无法检测，返回 auto
    return 'auto';
  }

  /**
   * 智能选择翻译方向
   * @param {string} detectedLang 检测到的语言
   * @param {string} userTargetLang 用户设置的目标语言
   * @returns {Object|null} 翻译方向对象或 null（如果不需要翻译）
   */
  getTranslationDirection(detectedLang, userTargetLang) {
    if (detectedLang === 'auto' || detectedLang === userTargetLang) {
      return null;
    }

    return {
      source: detectedLang,
      target: userTargetLang
    };
  }

  /**
   * 检查文本是否包含多种语言
   * @param {string} text 要检查的文本
   * @returns {boolean} 是否包含多种语言
   */
  isMultilingual(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const detectedLanguages = new Set();
    
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(text)) {
        detectedLanguages.add(lang);
      }
    }

    return detectedLanguages.size > 1;
  }

  /**
   * 获取文本的主要语言
   * @param {string} text 要分析的文本
   * @returns {string} 主要语言代码
   */
  getPrimaryLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'auto';
    }

    const cleanText = text.trim();
    if (cleanText.length === 0) {
      return 'auto';
    }

    // 按优先级检测语言
    const priorityOrder = ['zh-CN', 'ja', 'ko', 'ar', 'ru', 'hi', 'en'];
    
    for (const lang of priorityOrder) {
      if (this.languagePatterns[lang].test(cleanText)) {
        return lang;
      }
    }

    return 'auto';
  }

  /**
   * 验证语言代码是否有效
   * @param {string} langCode 语言代码
   * @returns {boolean} 是否有效
   */
  isValidLanguageCode(langCode) {
    return Object.keys(this.languagePatterns).includes(langCode) || langCode === 'auto';
  }
}
