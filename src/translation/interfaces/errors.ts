/**
 * 翻译错误基类
 */
export interface TranslationErrorDetails {
  [key: string]: unknown;
}

export class TranslationError extends Error {
  code: number;

  provider: string;

  details: TranslationErrorDetails;

  constructor(message: string, code: number, provider: string, details: TranslationErrorDetails = {}) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.provider = provider;
    this.details = details;
  }
}

/**
 * API 密钥无效错误
 */
export class InvalidApiKeyError extends TranslationError {
  constructor(provider: string, details?: TranslationErrorDetails) {
    super(`Invalid API key for ${provider}`, 401, provider, details);
    this.name = 'InvalidApiKeyError';
  }
}

/**
 * 配额超限错误
 */
export class QuotaExceededError extends TranslationError {
  constructor(provider: string, details?: TranslationErrorDetails) {
    super(`Quota exceeded for ${provider}`, 429, provider, details);
    this.name = 'QuotaExceededError';
  }
}

/**
 * 不支持的语言对错误
 */
export class UnsupportedLanguagePairError extends TranslationError {
  constructor(provider: string, sourceLang: string, targetLang: string) {
    super(
      `Language pair ${sourceLang}-${targetLang} not supported by ${provider}`,
      400,
      provider,
      { sourceLang, targetLang }
    );
    this.name = 'UnsupportedLanguagePairError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends TranslationError {
  constructor(provider: string, originalError: Error) {
    super(`Network error for ${provider}: ${originalError.message}`, 0, provider, {
      originalError: originalError.message
    });
    this.name = 'NetworkError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends TranslationError {
  constructor(provider: string, timeout: number) {
    super(`Request timeout for ${provider} after ${timeout}ms`, 408, provider, { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * 服务器错误
 */
export class ServerError extends TranslationError {
  constructor(provider: string, statusCode: number, message: string) {
    super(`Server error for ${provider}: ${message}`, statusCode, provider);
    this.name = 'ServerError';
  }
}
