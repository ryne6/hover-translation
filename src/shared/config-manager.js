/**
 * 配置管理器
 * 统一管理所有配置的验证、转换和默认值
 */
export class ConfigManager {
  /**
   * 获取默认配置
   * @returns {Object}
   */
  static getDefaults() {
    return {
      providers: {},
      primaryProvider: '',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      formality: 'default',
      domain: 'general',
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true,
    };
  }

  /**
   * 验证配置是否有效
   * @param {Object} settings - 用户设置
   * @returns {{valid: boolean, message?: string}}
   */
  static validate(settings) {
    if (!settings || typeof settings !== 'object') {
      return { valid: false, message: '配置格式无效' };
    }

    // 检查是否有 providers 配置
    if (!settings.providers || typeof settings.providers !== 'object') {
      return { valid: false, message: '缺少翻译服务配置' };
    }

    // 检查是否至少有一个启用的服务
    const enabledProviders = Object.entries(settings.providers)
      .filter(([id, config]) => config && config.enabled);

    if (enabledProviders.length === 0) {
      return { valid: false, message: '请至少启用一个翻译服务' };
    }

    // 检查主要服务是否已启用
    if (settings.primaryProvider) {
      const primaryConfig = settings.providers[settings.primaryProvider];
      if (!primaryConfig || !primaryConfig.enabled) {
        return { valid: false, message: '主要翻译服务未启用' };
      }
    }

    return { valid: true };
  }

  /**
   * 转换为 TranslationManager 配置格式
   * @param {Object} settings - 用户设置
   * @returns {Object} TranslationManager 配置
   */
  static toTranslationConfig(settings) {
    // 合并默认值
    const merged = { ...this.getDefaults(), ...settings };

    return {
      primaryProvider: merged.primaryProvider || '',
      fallbackProviders: merged.fallbackProviders || [],
      providers: merged.providers || {},
      options: {
        autoFallback: merged.autoFallback !== false,
        cacheResults: merged.enableCache !== false,
        parallelTranslation: merged.parallelTranslation || false,
        retryCount: merged.retryCount || 3,
        timeout: merged.timeout || 30000,
        formality: merged.formality || 'default',
        domain: merged.domain || 'general',
      },
      languagePairPreferences: merged.languagePairPreferences || {},
    };
  }

  /**
   * 从旧配置迁移到新配置（兼容性）
   * @param {Object} oldSettings - 旧配置
   * @returns {Object} 新配置
   */
  static migrate(oldSettings) {
    const newSettings = this.getDefaults();

    // 如果已经是新格式，直接返回
    if (oldSettings.providers && typeof oldSettings.providers === 'object') {
      return { ...newSettings, ...oldSettings };
    }

    // 转换旧格式
    const providers = {};

    if (oldSettings.googleApiKey) {
      providers.google = {
        enabled: true,
        apiKey: oldSettings.googleApiKey,
      };
    }

    if (oldSettings.baiduAppId && oldSettings.baiduApiKey) {
      providers.baidu = {
        enabled: true,
        apiKey: oldSettings.baiduAppId,
        apiSecret: oldSettings.baiduApiKey,
      };
    }

    if (oldSettings.deeplApiKey) {
      providers.deepl = {
        enabled: true,
        apiKey: oldSettings.deeplApiKey,
      };
    }

    if (oldSettings.openaiApiKey) {
      providers.openai = {
        enabled: true,
        apiKey: oldSettings.openaiApiKey,
        model: oldSettings.openaiModel || 'gpt-3.5-turbo',
      };
    }

    if (oldSettings.microsoftApiKey) {
      providers.microsoft = {
        enabled: true,
        apiKey: oldSettings.microsoftApiKey,
        region: oldSettings.microsoftRegion || 'global',
      };
    }

    if (oldSettings.youdaoAppId && oldSettings.youdaoApiKey) {
      providers.youdao = {
        enabled: true,
        apiKey: oldSettings.youdaoAppId,
        apiSecret: oldSettings.youdaoApiKey,
      };
    }

    if (oldSettings.tencentSecretId && oldSettings.tencentSecretKey) {
      providers.tencent = {
        enabled: true,
        apiKey: oldSettings.tencentSecretId,
        apiSecret: oldSettings.tencentSecretKey,
      };
    }

    if (oldSettings.claudeApiKey) {
      providers.claude = {
        enabled: true,
        apiKey: oldSettings.claudeApiKey,
        model: oldSettings.claudeModel || 'claude-3-haiku-20240307',
      };
    }

    if (oldSettings.geminiApiKey) {
      providers.gemini = {
        enabled: true,
        apiKey: oldSettings.geminiApiKey,
        model: oldSettings.geminiModel || 'gemini-1.5-flash',
      };
    }

    return {
      ...newSettings,
      providers,
      primaryProvider: oldSettings.translationProvider || '',
      fallbackProviders: oldSettings.fallbackProviders || [],
      targetLanguage: oldSettings.targetLanguage || 'zh-CN',
      sourceLanguage: oldSettings.sourceLanguage || 'auto',
      enableCache: oldSettings.enableCache !== false,
      autoDetect: oldSettings.autoDetect !== false,
      showOriginal: oldSettings.showOriginal !== false,
      timeout: oldSettings.timeout || 30000,
      retryCount: oldSettings.retryCount || 3,
    };
  }

  /**
   * 记录配置信息（用于调试）
   * @param {Object} settings - 配置
   */
  static logConfig(settings) {
    const enabledProviders = Object.entries(settings.providers || {})
      .filter(([id, config]) => config && config.enabled)
      .map(([id]) => id);

    console.log('📋 Configuration Summary:', {
      primaryProvider: settings.primaryProvider,
      fallbackProviders: settings.fallbackProviders,
      enabledProviders,
      totalProviders: Object.keys(settings.providers || {}).length,
      enabledCount: enabledProviders.length,
    });
  }
}
