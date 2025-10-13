import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter.js';
import { COMMON_LANGUAGES } from '../../utils/language-codes.js';

/**
 * Google Translate 适配器
 */
export class GoogleTranslateAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'google',
      name: 'Google Translate',
      displayName: 'Google 翻译',
      description: '支持最多语言的翻译服务，翻译质量稳定可靠',
      logo: '/assets/icons/providers/google.png',
      category: 'traditional',
      supportedLanguages: COMMON_LANGUAGES.filter(l => l.code !== 'auto'),
      features: [
        { name: '自动检测', description: '自动识别源语言', available: true },
        { name: '批量翻译', description: '支持多文本翻译', available: true },
        { name: '高速翻译', description: '响应速度快', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'usage-based',
        paidPricing: '$20/百万字符',
        billingUnit: 'character',
        details: 'Google Cloud Translation API 按使用量计费',
      },
      rateLimit: {
        requestsPerSecond: 100,
        charactersPerRequest: 5000,
      },
      homepage: 'https://cloud.google.com/translate',
      documentation: 'https://cloud.google.com/translate/docs',
    });
  }

  async translate(request) {
    const url = 'https://translation.googleapis.com/language/translate/v2';
    
    const params = new URLSearchParams({
      q: request.text,
      target: request.targetLang,
      key: this.config.apiKey,
      format: 'text',
    });

    if (request.sourceLang && request.sourceLang !== 'auto') {
      params.append('source', request.sourceLang);
    }

    const data = await this.retryRequest(async () => {
      return await this.makeRequest(`${url}?${params.toString()}`, {
        method: 'POST',
      });
    });

    const translation = data.data.translations[0];

    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
      provider: 'google',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length,
      },
    };
  }

  async detectLanguage(text) {
    const url = 'https://translation.googleapis.com/language/translate/v2/detect';
    
    const params = new URLSearchParams({
      q: text,
      key: this.config.apiKey,
    });

    const data = await this.makeRequest(`${url}?${params.toString()}`, {
      method: 'POST',
    });

    const detection = data.data.detections[0][0];

    return {
      language: detection.language,
      confidence: detection.confidence,
    };
  }

  async validateApiKey() {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 无效或已过期',
        details: { error: error.message },
      };
    }
  }
}
