import { AdapterFactory } from './AdapterFactory.js';
import { CacheManager } from './CacheManager.js';
import { StatsManager } from './StatsManager.js';

/**
 * 翻译管理器
 * 核心管理器，负责协调所有翻译服务
 */
export class TranslationManager {
  constructor() {
    this.config = null;
    this.adapters = new Map();
    this.cacheManager = new CacheManager();
    this.statsManager = new StatsManager();
    this.initialized = false;
  }

  /**
   * 初始化管理器
   * @param {import('../interfaces/types.js').TranslationManagerConfig} config
   */
  async initialize(config) {
    console.log('Initializing TranslationManager...');
    
    this.config = config;

    // 初始化所有已配置的适配器
    for (const [providerId, providerConfig] of Object.entries(config.providers)) {
      if (!providerConfig.enabled) {
        console.log(`✗ ${providerId} disabled`);
        continue;
      }

      try {
        const adapter = AdapterFactory.createAdapter(providerId, providerConfig);
        const validation = await adapter.validateConfig();

        if (validation.valid) {
          this.adapters.set(providerId, adapter);
          console.log(`✓ ${providerId} adapter initialized`);
        } else {
          console.warn(`✗ ${providerId} validation failed: ${validation.message}`);
        }
      } catch (error) {
        console.error(`✗ ${providerId} initialization failed:`, error);
      }
    }

    this.initialized = true;
    console.log(`TranslationManager initialized with ${this.adapters.size} providers`);
  }

  /**
   * 翻译文本
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @returns {Promise<import('../interfaces/types.js').TranslationResponse>}
   */
  async translate(request) {
    if (!this.initialized) {
      throw new Error('TranslationManager not initialized');
    }

    // 1. 检查缓存
    if (this.config.options.cacheResults) {
      const cached = await this.cacheManager.get(request);
      if (cached) {
        console.log('✓ Cache hit');
        return cached;
      }
    }

    // 2. 选择提供商
    const providerId = this.selectProvider(request);
    console.log(`Selected provider: ${providerId}`);

    // 3. 执行翻译（带自动降级）
    const startTime = Date.now();
    
    try {
      const response = await this.translateWithFallback(request, providerId);
      
      // 记录响应时间
      this.statsManager.recordResponseTime(response.provider, Date.now() - startTime);

      // 4. 缓存结果
      if (this.config.options.cacheResults) {
        await this.cacheManager.set(request, response);
      }

      // 5. 记录统计
      await this.statsManager.recordSuccess(response);

      return response;
    } catch (error) {
      await this.statsManager.recordFailure(providerId, error);
      throw error;
    }
  }

  /**
   * 选择最佳提供商
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @returns {string}
   */
  selectProvider(request) {
    // 1. 使用用户指定的提供商
    if (request.options?.preferredProvider) {
      const adapter = this.adapters.get(request.options.preferredProvider);
      if (adapter && adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return request.options.preferredProvider;
      }
    }

    // 2. 检查语言对偏好
    if (this.config.languagePairPreferences) {
      const pairKey = `${request.sourceLang}-${request.targetLang}`;
      const preferredProvider = this.config.languagePairPreferences[pairKey];
      
      if (preferredProvider && this.adapters.has(preferredProvider)) {
        const adapter = this.adapters.get(preferredProvider);
        if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
          return preferredProvider;
        }
      }
    }

    // 3. 使用推荐提供商
    const recommended = AdapterFactory.recommendProvider(
      request.sourceLang,
      request.targetLang
    );
    
    if (recommended && this.adapters.has(recommended)) {
      const adapter = this.adapters.get(recommended);
      if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return recommended;
      }
    }

    // 4. 使用主要提供商
    if (this.adapters.has(this.config.primaryProvider)) {
      const adapter = this.adapters.get(this.config.primaryProvider);
      if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return this.config.primaryProvider;
      }
    }

    // 5. 使用第一个可用的提供商
    for (const [providerId, adapter] of this.adapters) {
      if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return providerId;
      }
    }

    throw new Error('No available translation provider for this language pair');
  }

  /**
   * 带降级的翻译
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @param {string} primaryProviderId
   * @returns {Promise<import('../interfaces/types.js').TranslationResponse>}
   */
  async translateWithFallback(request, primaryProviderId) {
    const providers = [primaryProviderId];
    
    // 添加备用提供商
    if (this.config.options.autoFallback) {
      providers.push(...this.config.fallbackProviders);
    }

    let lastError;

    for (const providerId of providers) {
      const adapter = this.adapters.get(providerId);

      if (!adapter) continue;

      if (!adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        continue;
      }

      try {
        console.log(`Translating with ${providerId}...`);
        const response = await adapter.translate(request);

        if (providerId !== primaryProviderId) {
          console.log(`✓ Fallback to ${providerId} succeeded`);
        }

        return response;
      } catch (error) {
        console.error(`✗ ${providerId} failed:`, error.message);
        lastError = error;

        if (!this.config.options.autoFallback) {
          throw error;
        }

        // 继续尝试下一个提供商
        continue;
      }
    }

    throw lastError || new Error('All translation providers failed');
  }

  /**
   * 检测语言
   * @param {string} text
   * @param {string} [providerId]
   * @returns {Promise<import('../interfaces/types.js').LanguageDetectionResult>}
   */
  async detectLanguage(text, providerId) {
    const id = providerId || this.config.primaryProvider;
    const adapter = this.adapters.get(id);

    if (!adapter) {
      throw new Error(`Provider not found: ${id}`);
    }

    return adapter.detectLanguage(text);
  }

  /**
   * 并行翻译（用于对比）
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @param {string[]} providerIds
   * @returns {Promise<Map<string, import('../interfaces/types.js').TranslationResponse>>}
   */
  async parallelTranslate(request, providerIds) {
    const results = new Map();

    const promises = providerIds.map(async (providerId) => {
      const adapter = this.adapters.get(providerId);
      if (!adapter) return;

      if (!adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return;
      }

      try {
        const response = await adapter.translate(request);
        results.set(providerId, response);
        await this.statsManager.recordSuccess(response);
      } catch (error) {
        console.error(`${providerId} parallel translation failed:`, error);
        await this.statsManager.recordFailure(providerId, error);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * 批量翻译
   * @param {import('../interfaces/types.js').TranslationRequest[]} requests
   * @returns {Promise<import('../interfaces/types.js').TranslationResponse[]>}
   */
  async batchTranslate(requests) {
    return Promise.all(requests.map(request => this.translate(request)));
  }

  /**
   * 获取可用的提供商信息
   * @returns {import('../interfaces/types.js').ProviderInfo[]}
   */
  getAvailableProviders() {
    // 返回所有注册的提供商，而不仅仅是已初始化的
    return AdapterFactory.getAvailableProviders();
  }

  /**
   * 获取提供商配额
   * @param {string} providerId
   * @returns {Promise<import('../interfaces/types.js').QuotaInfo|null>}
   */
  async getQuota(providerId) {
    const adapter = this.adapters.get(providerId);
    if (!adapter || !adapter.getQuota) {
      return null;
    }

    return adapter.getQuota();
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return this.statsManager.getStats();
  }

  /**
   * 获取缓存统计
   * @returns {Object}
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cacheManager.clear();
  }

  /**
   * 清空统计
   */
  clearStats() {
    this.statsManager.clear();
  }

  /**
   * 更新配置
   * @param {import('../interfaces/types.js').TranslationManagerConfig} config
   */
  async updateConfig(config) {
    await this.initialize(config);
  }

  /**
   * 检查提供商是否可用
   * @param {string} providerId
   * @returns {boolean}
   */
  isProviderAvailable(providerId) {
    return this.adapters.has(providerId);
  }

  /**
   * 验证提供商配置
   * @param {string} providerId
   * @returns {Promise<import('../interfaces/types.js').ValidationResult>}
   */
  async validateProvider(providerId) {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      return {
        valid: false,
        message: 'Provider not found',
      };
    }

    return adapter.validateConfig();
  }
}
