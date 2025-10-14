import { AdapterFactory } from './AdapterFactory';
import { CacheManager } from './CacheManager';
import { StatsManager } from './StatsManager';
import type {
  ProviderInfo,
  TranslationManagerConfig,
  TranslationRequest,
  TranslationResponse,
  ValidationResult,
  QuotaInfo,
  LanguageDetectionResult
} from '../interfaces/types';
import type { ITranslationAdapter } from '../interfaces/ITranslationAdapter';

export class TranslationManager {
  private config: TranslationManagerConfig | null = null;

  private readonly adapters: Map<string, ITranslationAdapter> = new Map();

  private readonly cacheManager = new CacheManager();

  private readonly statsManager = new StatsManager();

  private initialized = false;

  async initialize(config: TranslationManagerConfig): Promise<void> {
    console.log('Initializing TranslationManager...');

    this.config = config;
    this.adapters.clear();

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

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.initialized || !this.config) {
      throw new Error('TranslationManager not initialized');
    }

    if (this.config.options.cacheResults) {
      const cached = await this.cacheManager.get(request);
      if (cached) {
        console.log('✓ Cache hit');
        return { ...cached, cached: true };
      }
    }

    const providerId = this.selectProvider(request, this.config);
    console.log(`Selected provider: ${providerId}`);

    const startTime = Date.now();

    try {
      const response = await this.translateWithFallback(request, providerId, this.config);

      this.statsManager.recordResponseTime(response.provider, Date.now() - startTime);

      if (this.config.options.cacheResults) {
        await this.cacheManager.set(request, response);
      }

      await this.statsManager.recordSuccess(response);

      return response;
    } catch (error) {
      await this.statsManager.recordFailure(providerId, error as Error);
      throw error;
    }
  }

  private selectProvider(request: TranslationRequest, config: TranslationManagerConfig): string {
    if (request.options?.preferredProvider) {
      const adapter = this.adapters.get(request.options.preferredProvider);
      if (adapter && adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return request.options.preferredProvider;
      }
    }

    if (config.languagePairPreferences) {
      const pairKey = `${request.sourceLang}-${request.targetLang}`;
      const preferredProvider = config.languagePairPreferences[pairKey];

      if (preferredProvider) {
        const adapter = this.adapters.get(preferredProvider);
        if (adapter && adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
          return preferredProvider;
        }
      }
    }

    const recommended = AdapterFactory.recommendProvider(request.sourceLang, request.targetLang);
    if (recommended) {
      const adapter = this.adapters.get(recommended);
      if (adapter && adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return recommended;
      }
    }

    if (this.adapters.has(config.primaryProvider)) {
      const adapter = this.adapters.get(config.primaryProvider)!;
      if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return config.primaryProvider;
      }
    }

    for (const [providerId, adapter] of this.adapters) {
      if (adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return providerId;
      }
    }

    throw new Error('No available translation provider for this language pair');
  }

  private async translateWithFallback(
    request: TranslationRequest,
    primaryProviderId: string,
    config: TranslationManagerConfig
  ): Promise<TranslationResponse> {
    const providers = new Set<string>([primaryProviderId]);

    if (config.options.autoFallback) {
      config.fallbackProviders.forEach((providerId) => providers.add(providerId));
    }

    let lastError: unknown;

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
        console.error(`✗ ${providerId} failed:`, (error as Error).message);
        lastError = error;

        if (!config.options.autoFallback) {
          throw error;
        }
      }
    }

    throw lastError || new Error('All translation providers failed');
  }

  async detectLanguage(text: string, providerId?: string): Promise<LanguageDetectionResult> {
    if (!this.config) {
      throw new Error('TranslationManager not initialized');
    }

    const id = providerId || this.config.primaryProvider;
    const adapter = this.adapters.get(id);

    if (!adapter) {
      throw new Error(`Provider not found: ${id}`);
    }

    return adapter.detectLanguage(text);
  }

  async parallelTranslate(request: TranslationRequest, providerIds: string[]): Promise<Map<string, TranslationResponse>> {
    const results = new Map<string, TranslationResponse>();

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
        await this.statsManager.recordFailure(providerId, error as Error);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    return Promise.all(requests.map((request) => this.translate(request)));
  }

  getAvailableProviders(): ProviderInfo[] {
    return AdapterFactory.getAvailableProviders();
  }

  async getQuota(providerId: string): Promise<QuotaInfo | null> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      return null;
    }

    if (typeof adapter.getQuota !== 'function') {
      return null;
    }

    return adapter.getQuota();
  }

  getStats() {
    return this.statsManager.getStats();
  }

  getCacheStats() {
    return this.cacheManager.getStats();
  }

  clearCache(): void {
    this.cacheManager.clear();
  }

  clearStats(): void {
    this.statsManager.clear();
  }

  async updateConfig(config: TranslationManagerConfig): Promise<void> {
    await this.initialize(config);
  }

  isProviderAvailable(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  async validateProvider(providerId: string): Promise<ValidationResult> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      return {
        valid: false,
        message: 'Provider not found'
      };
    }

    return adapter.validateConfig();
  }
}
