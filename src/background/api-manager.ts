import { TranslationManager } from '../translation/core/TranslationManager';
import { AdapterFactory } from '../translation/core/AdapterFactory';
import { BaseTranslationAdapter } from '../translation/adapters/base/BaseTranslationAdapter';
import { ConfigManager } from '../shared/config-manager';
import { Logger } from '../shared/logger';
import { LanguageDetector } from '../shared/language-detector';

import { GoogleTranslateAdapter } from '../translation/adapters/traditional/GoogleTranslateAdapter';
import { BaiduTranslateAdapter } from '../translation/adapters/traditional/BaiduTranslateAdapter';
import { DeepLAdapter } from '../translation/adapters/traditional/DeepLAdapter';
import { MicrosoftTranslatorAdapter } from '../translation/adapters/traditional/MicrosoftTranslatorAdapter';
import { YoudaoTranslateAdapter } from '../translation/adapters/traditional/YoudaoTranslateAdapter';
import { TencentTranslateAdapter } from '../translation/adapters/traditional/TencentTranslateAdapter';
import { OpenAIAdapter } from '../translation/adapters/ai/OpenAIAdapter';
import { ClaudeAdapter } from '../translation/adapters/ai/ClaudeAdapter';
import { GeminiAdapter } from '../translation/adapters/ai/GeminiAdapter';
import { TTSManager } from '../tts/TTSManager';
import type { TTSSynthesisRequest, TTSSynthesisResponse } from '../tts/interfaces';

import type {
  TranslationManagerConfig,
  TranslationRequest,
  TranslationResponse,
  ProviderInfo,
  ValidationResult,
  AdapterConfig,
  QuotaInfo
} from '../translation/interfaces/types';
import type { TranslationSettings } from '../shared/config-manager';

const ADAPTER_MAP: Record<string, new () => BaseTranslationAdapter> = {
  google: GoogleTranslateAdapter,
  deepl: DeepLAdapter,
  baidu: BaiduTranslateAdapter,
  microsoft: MicrosoftTranslatorAdapter,
  youdao: YoudaoTranslateAdapter,
  tencent: TencentTranslateAdapter,
  openai: OpenAIAdapter,
  claude: ClaudeAdapter,
  gemini: GeminiAdapter
};

export class APIManager {
  private translationManager: TranslationManager | null = null;

  private ttsManager: TTSManager | null = null;

  private initialized = false;

  async initialize(settings: TranslationSettings): Promise<void> {
    Logger.group('APIManager', 'Initializing');

    try {
      const validation = ConfigManager.validate(settings);
      if (!validation.valid) {
        Logger.error('APIManager', 'Invalid settings', validation.message);
        throw new Error(validation.message || 'Invalid settings');
      }

      const config: TranslationManagerConfig = ConfigManager.toTranslationConfig(settings);
      Logger.log('APIManager', 'Built translation config', {
        primary: config.primaryProvider,
        fallback: config.fallbackProviders,
        enabledProviders: Object.entries(config.providers)
          .filter(([_id, cfg]) => cfg.enabled)
          .map(([providerId]) => providerId)
      });

      this.translationManager = new TranslationManager();
      await this.translationManager.initialize(config);

      this.ttsManager = new TTSManager(settings);

      const providerCount = this.translationManager.getAvailableProviders().length;
      this.initialized = true;
      Logger.success('APIManager', `Initialized with ${providerCount} providers`);
    } catch (error) {
      Logger.error('APIManager', 'Initialization failed', error);
      throw error;
    } finally {
      Logger.groupEnd();
    }
  }

  private getManager(): TranslationManager {
    if (!this.initialized || !this.translationManager) {
      Logger.warn('APIManager', 'Translation manager not initialized');
      throw new Error('Translation service not configured. Please configure at least one translation service.');
    }
    return this.translationManager;
  }

  private getTTSManager(): TTSManager {
    if (!this.ttsManager) {
      throw new Error('语音合成服务未初始化');
    }
    return this.ttsManager;
  }

  async translate(text: string, sourceLang: string = 'auto', targetLang: string = 'zh-CN'): Promise<TranslationResponse> {
    const manager = this.getManager();

    const request: TranslationRequest = {
      text,
      sourceLang,
      targetLang
    };

    Logger.log('APIManager', 'Translating', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      from: sourceLang,
      to: targetLang
    });

    try {
      const result = await manager.translate(request);
      Logger.success('APIManager', 'Translation completed', {
        provider: result.provider,
        cached: (result as TranslationResponse & { cached?: boolean }).cached
      });
      return result;
    } catch (error) {
      Logger.error('APIManager', 'Translation failed', error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.initialized || !this.translationManager) {
      Logger.warn('APIManager', 'Not initialized, using local detection');
      const detector = new LanguageDetector();
      return detector.detectLanguage(text);
    }

    const result = await this.translationManager.detectLanguage(text);
    return result.language;
  }

  async parallelTranslate(
    text: string,
    sourceLang: string,
    targetLang: string,
    providerIds: string[]
  ): Promise<Map<string, TranslationResponse>> {
    const manager = this.getManager();

    const request: TranslationRequest = {
      text,
      sourceLang,
      targetLang
    };

    Logger.log('APIManager', 'Parallel translation', { providers: providerIds });
    return manager.parallelTranslate(request, providerIds);
  }

  getAvailableProviders(): ProviderInfo[] {
    const providers = AdapterFactory.getAvailableProviders();
    Logger.log('APIManager', `Returning ${providers.length} available providers`);
    return providers;
  }

  async validateProvider(providerId: string, config: AdapterConfig): Promise<ValidationResult> {
    Logger.log('APIManager', `Validating ${providerId}`);

    const AdapterCtor = ADAPTER_MAP[providerId];
    if (!AdapterCtor) {
      Logger.error('APIManager', `Unknown provider: ${providerId}`);
      return { valid: false, message: '未知的翻译服务' };
    }

    try {
      const adapter = new AdapterCtor();
      adapter.configure(config);
      const result = await adapter.validateConfig();

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
        message: `验证出错: ${(error as Error).message}`
      };
    }
  }

  async getQuota(providerId: string): Promise<QuotaInfo | null> {
    const manager = this.getManager();
    return manager.getQuota(providerId);
  }

  getStats() {
    if (!this.initialized || !this.translationManager) {
      return {
        total: { requests: 0, successes: 0, failures: 0, characters: 0, cost: 0 },
        today: { requests: 0, characters: 0, cost: 0 },
        byProvider: {},
        lastReset: new Date().toDateString()
      };
    }

    return this.translationManager.getStats();
  }

  getCacheStats() {
    if (!this.initialized || !this.translationManager) {
      return { size: 0, maxSize: 0, ttl: 0, usage: '0%' };
    }

    return this.translationManager.getCacheStats();
  }

  clearCache(): void {
    if (this.initialized && this.translationManager) {
      this.translationManager.clearCache();
      Logger.success('APIManager', 'Cache cleared');
    }
  }

  clearStats(): void {
    if (this.initialized && this.translationManager) {
      this.translationManager.clearStats();
      Logger.success('APIManager', 'Stats cleared');
    }
  }

  isTTSEnabled(): boolean {
    try {
      return this.getTTSManager().isEnabled();
    } catch (error) {
      return false;
    }
  }

  getSpeechSettings() {
    try {
      return this.getTTSManager().getSpeechSettings();
    } catch (error) {
      return null;
    }
  }

  async synthesizeSpeech(text: string, options: Partial<TTSSynthesisRequest> = {}): Promise<TTSSynthesisResponse> {
    const manager = this.getTTSManager();

    if (!manager.isEnabled()) {
      throw new Error('语音合成服务未启用');
    }

    Logger.log('APIManager', 'Synthesize speech request', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice: options.voiceName
    });

    const startTime = Date.now();
    
    try {
      const response = await manager.synthesize({
        text,
        ...options
      });

      const responseTime = Date.now() - startTime;
      
      // 记录 TTS 成功统计
      if (this.translationManager) {
        const statsManager = (this.translationManager as any).statsManager;
        if (statsManager && typeof statsManager.recordTTSSuccess === 'function') {
          await statsManager.recordTTSSuccess(text, responseTime);
        }
      }

      Logger.success('APIManager', 'Speech synthesis completed', {
        provider: response.provider,
        responseTime: `${responseTime}ms`
      });

      return response;
    } catch (error) {
      // 记录 TTS 失败统计
      if (this.translationManager) {
        const statsManager = (this.translationManager as any).statsManager;
        if (statsManager && typeof statsManager.recordTTSFailure === 'function') {
          await statsManager.recordTTSFailure(error as Error);
        }
      }

      Logger.error('APIManager', 'Speech synthesis failed', error);
      throw error;
    }
  }
}
