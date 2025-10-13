/**
 * 翻译错误基类
 */
export class TranslationError extends Error {
  constructor(message, code, provider, details = {}) {
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
  constructor(provider, details) {
    super(`Invalid API key for ${provider}`, 401, provider, details);
    this.name = 'InvalidApiKeyError';
  }
}

/**
 * 配额超限错误
 */
export class QuotaExceededError extends TranslationError {
  constructor(provider, details) {
    super(`Quota exceeded for ${provider}`, 429, provider, details);
    this.name = 'QuotaExceededError';
  }
}

/**
 * 不支持的语言对错误
 */
export class UnsupportedLanguagePairError extends TranslationError {
  constructor(provider, sourceLang, targetLang) {
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
  constructor(provider, originalError) {
    super(`Network error for ${provider}: ${originalError.message}`, 0, provider, {
      originalError: originalError.message,
    });
    this.name = 'NetworkError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends TranslationError {
  constructor(provider, timeout) {
    super(`Request timeout for ${provider} after ${timeout}ms`, 408, provider, { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * 服务器错误
 */
export class ServerError extends TranslationError {
  constructor(provider, statusCode, message) {
    super(`Server error for ${provider}: ${message}`, statusCode, provider);
    this.name = 'ServerError';
  }
}
