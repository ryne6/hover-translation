import { SupportedLanguageCode, TranslationProviderId } from './constants';

export interface ProviderInstanceConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  model?: string;
  [key: string]: unknown;
}

export type ProviderConfigMap = Record<string, ProviderInstanceConfig>;

export interface TranslationSettings {
  providers: ProviderConfigMap;
  primaryProvider: string;
  fallbackProviders: string[];
  targetLanguage: SupportedLanguageCode;
  sourceLanguage: SupportedLanguageCode | 'auto';
  enableCache: boolean;
  autoDetect: boolean;
  showOriginal: boolean;
  showTranslated?: boolean;
  formality?: string;
  domain?: string;
  timeout: number;
  retryCount: number;
  parallelTranslation: boolean;
  autoFallback: boolean;
  languagePairPreferences?: Record<string, string>;
  [key: string]: unknown;
}

export interface TranslationManagerOptions {
  autoFallback: boolean;
  cacheResults: boolean;
  parallelTranslation: boolean;
  retryCount: number;
  timeout: number;
  formality: string;
  domain: string;
}

export interface TranslationManagerConfig {
  primaryProvider: string;
  fallbackProviders: string[];
  providers: ProviderConfigMap;
  options: TranslationManagerOptions;
  languagePairPreferences: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

type LegacySettings = Partial<Record<string, unknown>> & {
  translationProvider?: TranslationProviderId | string;
  fallbackProviders?: string[];
  targetLanguage?: SupportedLanguageCode;
  sourceLanguage?: SupportedLanguageCode | 'auto';
  enableCache?: boolean;
  autoDetect?: boolean;
  showOriginal?: boolean;
  showTranslated?: boolean;
  timeout?: number;
  retryCount?: number;
  googleApiKey?: string;
  baiduAppId?: string;
  baiduApiKey?: string;
  deeplApiKey?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  microsoftApiKey?: string;
  microsoftRegion?: string;
  youdaoAppId?: string;
  youdaoApiKey?: string;
  tencentSecretId?: string;
  tencentSecretKey?: string;
  claudeApiKey?: string;
  claudeModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
};

export class ConfigManager {
  static getDefaults(): TranslationSettings {
    return {
      providers: {},
      primaryProvider: '',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      showTranslated: true,
      formality: 'default',
      domain: 'general',
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true
    };
  }

  static validate(settings: unknown): ValidationResult {
    if (!settings || typeof settings !== 'object') {
      return { valid: false, message: '配置格式无效' };
    }

    const candidate = settings as TranslationSettings;

    if (!candidate.providers || typeof candidate.providers !== 'object') {
      return { valid: false, message: '缺少翻译服务配置' };
    }

    const enabledProviders = Object.entries(candidate.providers)
      .filter(([_id, config]) => config && config.enabled);

    if (enabledProviders.length === 0) {
      return { valid: false, message: '请至少启用一个翻译服务' };
    }

    if (candidate.primaryProvider) {
      const primaryConfig = candidate.providers[candidate.primaryProvider];
      if (!primaryConfig || !primaryConfig.enabled) {
        return { valid: false, message: '主要翻译服务未启用' };
      }
    }

    return { valid: true };
  }

  static toTranslationConfig(settings: TranslationSettings): TranslationManagerConfig {
    const merged: TranslationSettings = { ...this.getDefaults(), ...settings };

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
        domain: merged.domain || 'general'
      },
      languagePairPreferences: merged.languagePairPreferences || {}
    };
  }

  static migrate(oldSettings: LegacySettings = {}): TranslationSettings {
    const newSettings = this.getDefaults();

    if (oldSettings.providers && typeof oldSettings.providers === 'object') {
      return { ...newSettings, ...(oldSettings as TranslationSettings) };
    }

    const providers: ProviderConfigMap = {};

    if (oldSettings.googleApiKey) {
      providers.google = {
        enabled: true,
        apiKey: String(oldSettings.googleApiKey)
      };
    }

    if (oldSettings.baiduAppId && oldSettings.baiduApiKey) {
      providers.baidu = {
        enabled: true,
        apiKey: String(oldSettings.baiduAppId),
        apiSecret: String(oldSettings.baiduApiKey)
      };
    }

    if (oldSettings.deeplApiKey) {
      providers.deepl = {
        enabled: true,
        apiKey: String(oldSettings.deeplApiKey)
      };
    }

    if (oldSettings.openaiApiKey) {
      providers.openai = {
        enabled: true,
        apiKey: String(oldSettings.openaiApiKey),
        model: String(oldSettings.openaiModel || 'gpt-3.5-turbo')
      };
    }

    if (oldSettings.microsoftApiKey) {
      providers.microsoft = {
        enabled: true,
        apiKey: String(oldSettings.microsoftApiKey),
        region: String(oldSettings.microsoftRegion || 'global')
      };
    }

    if (oldSettings.youdaoAppId && oldSettings.youdaoApiKey) {
      providers.youdao = {
        enabled: true,
        apiKey: String(oldSettings.youdaoAppId),
        apiSecret: String(oldSettings.youdaoApiKey)
      };
    }

    if (oldSettings.tencentSecretId && oldSettings.tencentSecretKey) {
      providers.tencent = {
        enabled: true,
        apiKey: String(oldSettings.tencentSecretId),
        apiSecret: String(oldSettings.tencentSecretKey)
      };
    }

    if (oldSettings.claudeApiKey) {
      providers.claude = {
        enabled: true,
        apiKey: String(oldSettings.claudeApiKey),
        model: String(oldSettings.claudeModel || 'claude-3-haiku-20240307')
      };
    }

    if (oldSettings.geminiApiKey) {
      providers.gemini = {
        enabled: true,
        apiKey: String(oldSettings.geminiApiKey),
        model: String(oldSettings.geminiModel || 'gemini-1.5-flash')
      };
    }

    return {
      ...newSettings,
      providers,
      primaryProvider: String(oldSettings.translationProvider || ''),
      fallbackProviders: Array.isArray(oldSettings.fallbackProviders) ? oldSettings.fallbackProviders.map(String) : [],
      targetLanguage: (oldSettings.targetLanguage as SupportedLanguageCode) || 'zh-CN',
      sourceLanguage: (oldSettings.sourceLanguage as SupportedLanguageCode | 'auto') || 'auto',
      enableCache: oldSettings.enableCache !== false,
      autoDetect: oldSettings.autoDetect !== false,
      showOriginal: oldSettings.showOriginal !== false,
      showTranslated: oldSettings.showTranslated !== false,
      timeout: typeof oldSettings.timeout === 'number' ? oldSettings.timeout : 30000,
      retryCount: typeof oldSettings.retryCount === 'number' ? oldSettings.retryCount : 3
    };
  }

  static logConfig(settings: TranslationSettings): void {
    const enabledProviders = Object.entries(settings.providers || {})
      .filter(([_id, config]) => config && config.enabled)
      .map(([providerId]) => providerId);

    console.log('📋 Configuration Summary:', {
      primaryProvider: settings.primaryProvider,
      fallbackProviders: settings.fallbackProviders,
      enabledProviders,
      totalProviders: Object.keys(settings.providers || {}).length,
      enabledCount: enabledProviders.length
    });
  }
}
