import { TranslationManager } from '../translation/core/TranslationManager.js';
import { AdapterFactory } from '../translation/core/AdapterFactory.js';
import { ConfigManager } from '../shared/config-manager.js';
import { Logger } from '../shared/logger.js';

// 导入所有适配器（用于验证）
import { GoogleTranslateAdapter } from '../translation/adapters/traditional/GoogleTranslateAdapter.js';
import { DeepLAdapter } from '../translation/adapters/traditional/DeepLAdapter.js';
import { BaiduTranslateAdapter } from '../translation/adapters/traditional/BaiduTranslateAdapter.js';
import { MicrosoftTranslatorAdapter } from '../translation/adapters/traditional/MicrosoftTranslatorAdapter.js';
import { YoudaoTranslateAdapter } from '../translation/adapters/traditional/YoudaoTranslateAdapter.js';
import { TencentTranslateAdapter } from '../translation/adapters/traditional/TencentTranslateAdapter.js';
import { OpenAIAdapter } from '../translation/adapters/ai/OpenAIAdapter.js';
import { ClaudeAdapter } from '../translation/adapters/ai/ClaudeAdapter.js';
import { GeminiAdapter } from '../translation/adapters/ai/GeminiAdapter.js';

/**
 * API 管理器
 * 使用新的翻译适配器系统
 */
export class APIManager {
  constructor() {
    this.translationManager = null;
    this.initialized = false;
  }

  /**
   * 初始化 API 管理器
   * @param {Object} settings - 用户设置
   */
  async initialize(settings) {
    Logger.group('APIManager', 'Initializing');

    try {
      // 1. 验证配置
      const validation = ConfigManager.validate(settings);
      if (!validation.valid) {
        Logger.error('APIManager', 'Invalid settings', validation.message);
        throw new Error(validation.message);
      }

      // 2. 转换配置
      const config = ConfigManager.toTranslationConfig(settings);
      Logger.log('APIManager', 'Built translation config', {
        primary: config.primaryProvider,
        fallback: config.fallbackProviders,
        enabledProviders: Object.entries(config.providers)
          .filter(([id, cfg]) => cfg.enabled)
          .map(([id]) => id),
      });

      // 3. 创建并初始化 TranslationManager
      this.translationManager = new TranslationManager();
      await this.translationManager.initialize(config);

      this.initialized = true;
      Logger.success('APIManager', `Initialized with ${this.translationManager.adapters.size} adapters`);
    } catch (error) {
      Logger.error('APIManager', 'Initialization failed', error);
      throw error;
    } finally {
      Logger.groupEnd();
    }
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {Promise<Object>} 翻译结果
   */
  async translate(text, sourceLang = 'auto', targetLang = 'zh-CN') {
    if (!this.initialized || !this.translationManager) {
      Logger.warn('APIManager', 'Not initialized, cannot translate');
      throw new Error('Translation service not configured. Please configure at least one translation service.');
    }

    const request = {
      text: text,
      sourceLang: sourceLang,
      targetLang: targetLang,
    };

    Logger.log('APIManager', 'Translating', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      from: sourceLang,
      to: targetLang,
    });

    try {
      const result = await this.translationManager.translate(request);
      Logger.success('APIManager', 'Translation completed', {
        provider: result.provider,
        cached: result.cached,
      });
      return result;
    } catch (error) {
      Logger.error('APIManager', 'Translation failed', error);
      throw error;
    }
  }

  /**
   * 检测语言
   * @param {string} text - 要检测的文本
   * @returns {Promise<string>} 检测到的语言代码
   */
  async detectLanguage(text) {
    if (!this.initialized || !this.translationManager) {
      Logger.warn('APIManager', 'Not initialized, using local detection');
      // 使用本地检测作为降级方案
      const { LanguageDetector } = await import('../shared/language-detector.js');
      const detector = new LanguageDetector();
      return detector.detectLanguage(text);
    }

    return await this.translationManager.detectLanguage(text);
  }

  /**
   * 并行翻译（多服务对比）
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @param {string[]} providerIds - 提供商ID列表
   * @returns {Promise<Map>} 翻译结果映射
   */
  async parallelTranslate(text, sourceLang, targetLang, providerIds) {
    if (!this.initialized || !this.translationManager) {
      throw new Error('Translation service not configured');
    }

    const request = {
      text: text,
      sourceLang: sourceLang,
      targetLang: targetLang,
    };

    Logger.log('APIManager', 'Parallel translation', { providers: providerIds });
    return await this.translationManager.parallelTranslate(request, providerIds);
  }

  /**
   * 获取所有可用提供商
   * @returns {Array}
   */
  getAvailableProviders() {
    // 直接从 AdapterFactory 获取所有注册的提供商
    const providers = AdapterFactory.getAvailableProviders();
    Logger.log('APIManager', `Returning ${providers.length} available providers`);
    return providers;
  }

  /**
   * 验证提供商配置
   * @param {string} providerId - 提供商ID
   * @param {Object} config - 配置
   * @returns {Promise<Object>} 验证结果
   */
  async validateProvider(providerId, config) {
    Logger.log('APIManager', `Validating ${providerId}`);

    try {
      // 动态创建适配器实例进行验证
      let AdapterClass;
      switch (providerId) {
        case 'google': AdapterClass = GoogleTranslateAdapter; break;
        case 'deepl': AdapterClass = DeepLAdapter; break;
        case 'baidu': AdapterClass = BaiduTranslateAdapter; break;
        case 'microsoft': AdapterClass = MicrosoftTranslatorAdapter; break;
        case 'youdao': AdapterClass = YoudaoTranslateAdapter; break;
        case 'tencent': AdapterClass = TencentTranslateAdapter; break;
        case 'openai': AdapterClass = OpenAIAdapter; break;
        case 'claude': AdapterClass = ClaudeAdapter; break;
        case 'gemini': AdapterClass = GeminiAdapter; break;
        default:
          Logger.error('APIManager', `Unknown provider: ${providerId}`);
          return { valid: false, message: '未知的翻译服务' };
      }

      const adapter = new AdapterClass();
      adapter.configure(config);
      const result = await adapter.validateApiKey();

      if (result.valid) {
        Logger.success('APIManager', `${providerId} validation passed`);
      } else {
        Logger.warn('APIManager', `${providerId} validation failed`, result.message);
      }

      return result;
    } catch (error) {
      Logger.error('APIManager', `${providerId} validation error`, error);
      return {
        valid: false,
        message: '验证出错: ' + error.message,
      };
    }
  }

  /**
   * 获取提供商配额
   * @param {string} providerId - 提供商ID
   * @returns {Promise<Object|null>}
   */
  async getQuota(providerId) {
    if (!this.initialized || !this.translationManager) {
      return null;
    }

    return await this.translationManager.getQuota(providerId);
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    if (!this.initialized || !this.translationManager) {
      return {
        total: { requests: 0, successes: 0, failures: 0, characters: 0, cost: 0 },
        today: { requests: 0, characters: 0, cost: 0 },
        byProvider: {},
      };
    }

    return this.translationManager.statsManager.getStats();
  }

  /**
   * 获取缓存统计
   * @returns {Object}
   */
  getCacheStats() {
    if (!this.initialized || !this.translationManager) {
      return { size: 0, usage: '0%' };
    }

    return this.translationManager.cacheManager.getStats();
  }

  /**
   * 清空缓存
   */
  clearCache() {
    if (this.initialized && this.translationManager) {
      this.translationManager.cacheManager.clear();
      Logger.success('APIManager', 'Cache cleared');
    }
  }

  /**
   * 清空统计
   */
  clearStats() {
    if (this.initialized && this.translationManager) {
      this.translationManager.statsManager.reset();
      Logger.success('APIManager', 'Stats cleared');
    }
  }
}
