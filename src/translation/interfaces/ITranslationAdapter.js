/**
 * 翻译适配器接口
 * 所有翻译服务适配器必须实现此接口
 */
export class ITranslationAdapter {
  /**
   * 翻译文本
   * @param {import('./types.js').TranslationRequest} request - 翻译请求
   * @returns {Promise<import('./types.js').TranslationResponse>}
   */
  async translate(request) {
    throw new Error('translate() must be implemented');
  }

  /**
   * 检测语言
   * @param {string} text - 要检测的文本
   * @returns {Promise<import('./types.js').LanguageDetectionResult>}
   */
  async detectLanguage(text) {
    throw new Error('detectLanguage() must be implemented');
  }

  /**
   * 配置适配器
   * @param {import('./types.js').AdapterConfig} config - 配置对象
   */
  configure(config) {
    throw new Error('configure() must be implemented');
  }

  /**
   * 验证配置
   * @returns {Promise<import('./types.js').ValidationResult>}
   */
  async validateConfig() {
    throw new Error('validateConfig() must be implemented');
  }

  /**
   * 获取提供商信息
   * @returns {import('./types.js').ProviderInfo}
   */
  getProviderInfo() {
    throw new Error('getProviderInfo() must be implemented');
  }

  /**
   * 获取支持的语言列表
   * @returns {import('./types.js').Language[]}
   */
  getSupportedLanguages() {
    throw new Error('getSupportedLanguages() must be implemented');
  }

  /**
   * 检查是否支持指定的语言对
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {boolean}
   */
  isLanguagePairSupported(sourceLang, targetLang) {
    throw new Error('isLanguagePairSupported() must be implemented');
  }

  /**
   * 获取配额信息（可选）
   * @returns {Promise<import('./types.js').QuotaInfo>}
   */
  async getQuota() {
    return null;
  }

  /**
   * 批量翻译（可选）
   * @param {import('./types.js').TranslationRequest[]} requests - 翻译请求数组
   * @returns {Promise<import('./types.js').TranslationResponse[]>}
   */
  async batchTranslate(requests) {
    // 默认实现：逐个翻译
    const results = [];
    for (const request of requests) {
      results.push(await this.translate(request));
    }
    return results;
  }
}
