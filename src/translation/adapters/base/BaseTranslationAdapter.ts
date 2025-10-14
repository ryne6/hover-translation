import { ITranslationAdapter } from '../../interfaces/ITranslationAdapter';
import {
  TranslationError,
  NetworkError,
  TimeoutError,
  ServerError,
  InvalidApiKeyError
} from '../../interfaces/errors';
import type {
  AdapterConfig,
  TranslationRequest,
  TranslationResponse,
  ValidationResult,
  ProviderInfo
} from '../../interfaces/types';

export class BaseTranslationAdapter extends ITranslationAdapter {
  protected providerInfo: ProviderInfo;
  protected config: AdapterConfig;

  constructor(providerInfo: ProviderInfo) {
    super();
    this.providerInfo = providerInfo;
    this.config = {};
  }

  configure(config: AdapterConfig): void {
    this.config = config;
  }

  getProviderInfo(): ProviderInfo {
    return this.providerInfo;
  }

  getSupportedLanguages(): ProviderInfo['supportedLanguages'] {
    return this.providerInfo.supportedLanguages;
  }

  isLanguagePairSupported(sourceLang: string, targetLang: string): boolean {
    const languages = this.getSupportedLanguages().map((l) => l.code);
    return (
      (sourceLang === 'auto' || languages.includes(sourceLang)) &&
      languages.includes(targetLang)
    );
  }

  async validateConfig(): Promise<ValidationResult> {
    // 检查必需的配置
    if (this.providerInfo.requiresApiKey && !this.config.apiKey) {
      return {
        valid: false,
        message: 'API Key 是必需的',
      };
    }

    if (this.providerInfo.requiresApiSecret && !this.config.apiSecret) {
      return {
        valid: false,
        message: 'API Secret 是必需的',
      };
    }

    // 子类可以覆盖以添加更多验证
    return this.validateApiKey();
  }

  /**
   * 验证 API Key（子类实现）
   * @returns {Promise<import('../../interfaces/types').ValidationResult>}
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async validateApiKey(): Promise<ValidationResult> {
    return { valid: true };
  }

  /**
   * 发起 HTTP 请求的辅助方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<any>}
   */
  async makeRequest<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const timeout = this.config.timeout || 30000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ServerError(
          this.providerInfo.id,
          response.status,
          errorData.message || response.statusText
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError(this.providerInfo.id, timeout);
      }
      
      if (error instanceof TranslationError) {
        throw error;
      }
      
      throw new NetworkError(this.providerInfo.id, error as Error);
    }
  }

  /**
   * 重试逻辑
   * @param {Function} fn - 要执行的函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delay - 重试延迟（毫秒）
   * @returns {Promise<any>}
   */
  async retryRequest<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 某些错误不应该重试
        if (
          error instanceof InvalidApiKeyError ||
          (error as { code?: number }).code === 401 ||
          (error as { code?: number }).code === 403
        ) {
          throw error;
        }

        if (i < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, i)); // 指数退避
        }
      }
    }

    throw lastError;
  }

  /**
   * 延迟执行
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 计算文本的哈希值（用于缓存）
   * @param {string} text - 文本
   * @returns {Promise<string>}
   */
  async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 生成缓存键
   * @param {string} text - 文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {string}
   */
  generateCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${this.providerInfo.id}:${sourceLang}:${targetLang}:${text.substring(0, 50)}`;
  }

  /**
   * 子类必须实现的方法
   */
  async translate(_request: TranslationRequest): Promise<TranslationResponse> {
    throw new Error(`translate() must be implemented by ${this.providerInfo.id}`);
  }

  async detectLanguage(_text: string): Promise<import('../../interfaces/types').LanguageDetectionResult> {
    throw new Error(`detectLanguage() must be implemented by ${this.providerInfo.id}`);
  }
}
