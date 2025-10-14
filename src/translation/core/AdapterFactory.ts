import { GoogleTranslateAdapter } from '../adapters/traditional/GoogleTranslateAdapter';
import { BaiduTranslateAdapter } from '../adapters/traditional/BaiduTranslateAdapter';
import { DeepLAdapter } from '../adapters/traditional/DeepLAdapter';
import { MicrosoftTranslatorAdapter } from '../adapters/traditional/MicrosoftTranslatorAdapter';
import { YoudaoTranslateAdapter } from '../adapters/traditional/YoudaoTranslateAdapter';
import { TencentTranslateAdapter } from '../adapters/traditional/TencentTranslateAdapter';
import { OpenAIAdapter } from '../adapters/ai/OpenAIAdapter';
import { ClaudeAdapter } from '../adapters/ai/ClaudeAdapter';
import { GeminiAdapter } from '../adapters/ai/GeminiAdapter';
import type { ITranslationAdapter } from '../interfaces/ITranslationAdapter';
import type { AdapterConfig, ProviderInfo } from '../interfaces/types';

type AdapterConstructor = new () => ITranslationAdapter;

/**
 * 适配器工厂
 * 负责创建和管理翻译适配器实例
 */
export class AdapterFactory {
  private static adapters: Map<string, AdapterConstructor> = new Map();

  private static instances: Map<string, ITranslationAdapter> = new Map();

  /**
   * 初始化工厂，注册所有适配器
   */
  static initialize(): void {
    // 注册传统翻译服务
    this.registerAdapter('google', GoogleTranslateAdapter);
    this.registerAdapter('baidu', BaiduTranslateAdapter);
    this.registerAdapter('deepl', DeepLAdapter);
    this.registerAdapter('microsoft', MicrosoftTranslatorAdapter);
    this.registerAdapter('youdao', YoudaoTranslateAdapter);
    this.registerAdapter('tencent', TencentTranslateAdapter);
    
    // 注册 AI 翻译服务
    this.registerAdapter('openai', OpenAIAdapter);
    this.registerAdapter('claude', ClaudeAdapter);
    this.registerAdapter('gemini', GeminiAdapter);
    
    console.log(`✓ AdapterFactory initialized with ${this.adapters.size} providers`);
  }

  /**
   * 注册适配器类
   * @param {string} providerId - 提供商ID
   * @param {typeof BaseTranslationAdapter} adapterClass - 适配器类
   */
  static registerAdapter(providerId: string, adapterClass: AdapterConstructor): void {
    this.adapters.set(providerId, adapterClass);
  }

  /**
   * 创建适配器实例
   * @param {string} providerId - 提供商ID
   * @param {import('../interfaces/types').AdapterConfig} config - 配置
   * @returns {import('../interfaces/ITranslationAdapter').ITranslationAdapter}
   */
  static createAdapter(providerId: string, config: AdapterConfig): ITranslationAdapter {
    const AdapterClass = this.adapters.get(providerId);

    if (!AdapterClass) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // 单例模式：每个 provider 只创建一个实例
    let instance = this.instances.get(providerId);

    if (!instance) {
      instance = new AdapterClass();
      this.instances.set(providerId, instance);
    }

    instance.configure(config);
    return instance;
  }

  /**
   * 获取所有可用的提供商信息
   * @returns {import('../interfaces/types').ProviderInfo[]}
   */
  static getAvailableProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = [];

    for (const [providerId, AdapterClass] of this.adapters) {
      try {
        const tempInstance = new AdapterClass();
        providers.push(tempInstance.getProviderInfo());
      } catch (error) {
        console.error(`Failed to get provider info for ${providerId}:`, error);
      }
    }

    return providers;
  }

  /**
   * 根据分类获取提供商
   * @param {'traditional'|'ai'|'local'} category - 分类
   * @returns {import('../interfaces/types').ProviderInfo[]}
   */
  static getProvidersByCategory(category: ProviderInfo['category']): ProviderInfo[] {
    return this.getAvailableProviders().filter((p) => p.category === category);
  }

  /**
   * 根据语言对推荐最佳提供商
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {string|null}
   */
  static recommendProvider(sourceLang: string, targetLang: string): string {
    // 语言对偏好映射
    const preferences: Record<string, string> = {
      // 中英互译
      'zh-CN-en': 'baidu',
      'en-zh-CN': 'baidu',
      'zh-TW-en': 'baidu',
      'en-zh-TW': 'baidu',
      
      // 中日互译
      'zh-CN-ja': 'youdao',
      'ja-zh-CN': 'youdao',
      
      // 欧洲语言
      'de-en': 'deepl',
      'en-de': 'deepl',
      'fr-en': 'deepl',
      'en-fr': 'deepl',
      'es-en': 'deepl',
      'en-es': 'deepl',
      'it-en': 'deepl',
      'en-it': 'deepl',
      'pt-en': 'deepl',
      'en-pt': 'deepl',
      'nl-en': 'deepl',
      'en-nl': 'deepl',
      'pl-en': 'deepl',
      'en-pl': 'deepl',
      'ru-en': 'deepl',
      'en-ru': 'deepl',
    };

    const key = `${sourceLang}-${targetLang}`;
    return preferences[key] || 'google';
  }

  /**
   * 检查提供商是否支持指定的语言对
   * @param {string} providerId - 提供商ID
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {boolean}
   */
  static isLanguagePairSupported(providerId: string, sourceLang: string, targetLang: string): boolean {
    const AdapterClass = this.adapters.get(providerId);
    if (!AdapterClass) return false;

    const tempInstance = new AdapterClass();
    return tempInstance.isLanguagePairSupported(sourceLang, targetLang);
  }

  /**
   * 清除所有实例缓存
   */
  static clearInstances(): void {
    this.instances.clear();
  }

  /**
   * 获取提供商实例（如果存在）
   * @param {string} providerId - 提供商ID
   * @returns {import('../interfaces/ITranslationAdapter').ITranslationAdapter|null}
   */
  static getInstance(providerId: string): ITranslationAdapter | null {
    return this.instances.get(providerId) || null;
  }
}

// 自动初始化
AdapterFactory.initialize();
