import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter';
import type { TranslationRequest, TranslationResponse, ValidationResult, QuotaInfo } from '../../interfaces/types';

/**
 * DeepL 适配器
 */
export class DeepLAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'deepl',
      name: 'DeepL',
      displayName: 'DeepL 翻译',
      description: '翻译质量最高，被认为最接近人工翻译',
      logo: '/assets/icons/providers/deepl.png',
      category: 'traditional',
      supportedLanguages: [
        { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
        { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      ],
      features: [
        { name: '超高质量', description: '最接近人工翻译的质量', available: true },
        { name: '风格选择', description: '支持正式/非正式风格', available: true },
        { name: '术语词典', description: '支持自定义术语', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'freemium',
        freeQuota: '50万字符/月',
        paidPricing: '$5.49/月起',
        billingUnit: 'character',
        details: 'Free 版每月 50 万字符，Pro 版按月订阅',
      },
      homepage: 'https://www.deepl.com',
      documentation: 'https://www.deepl.com/docs-api',
    });
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const isFreeApi = (this.config.apiKey ?? '').endsWith(':fx');
    const baseUrl = isFreeApi
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    const body: Record<string, unknown> = {
      text: [request.text],
      target_lang: this.convertLangCode(request.targetLang)
    };

    if (request.sourceLang && request.sourceLang !== 'auto') {
      body.source_lang = this.convertLangCode(request.sourceLang);
    }

    if (request.options?.formality && request.options.formality !== 'default') {
      body.formality = request.options.formality;
    }

    if (request.options?.preserveFormatting) {
      body.preserve_formatting = '1';
    }

    const data = await this.retryRequest(async () =>
      this.makeRequest<{ translations?: Array<{ text: string; detected_source_language?: string }> }>(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
    );

    const translation = data.translations?.[0];
    if (!translation) {
      throw new Error('DeepL response missing translations');
    }

    return {
      translatedText: translation.text,
      detectedSourceLanguage: translation.detected_source_language,
      provider: 'deepl',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length
      }
    };
  }

  async detectLanguage(text: string) {
    // DeepL 没有独立的语言检测 API，通过翻译来检测
    const result = await this.translate({
      text: text.substring(0, 100),
      sourceLang: 'auto',
      targetLang: 'en',
    });

    return {
      language: result.detectedSourceLanguage?.toLowerCase() || 'unknown',
      confidence: 0.9
    };
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      const isFreeApi = (this.config.apiKey ?? '').endsWith(':fx');
      const baseUrl = isFreeApi
        ? 'https://api-free.deepl.com/v2/usage'
        : 'https://api.deepl.com/v2/usage';

      await this.makeRequest(baseUrl, {
        method: 'GET',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.config.apiKey ?? ''}`
        }
      });

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 无效',
        details: { error: (error as Error).message }
      };
    }
  }

  async getQuota(): Promise<QuotaInfo | null> {
    try {
      const isFreeApi = (this.config.apiKey ?? '').endsWith(':fx');
      const baseUrl = isFreeApi
        ? 'https://api-free.deepl.com/v2/usage'
        : 'https://api.deepl.com/v2/usage';

      const data = await this.makeRequest<{ character_count: number; character_limit: number }>(baseUrl, {
        method: 'GET',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.config.apiKey ?? ''}`
        }
      });

      return {
        used: data.character_count,
        limit: data.character_limit,
        unit: 'character'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 转换语言代码（DeepL 使用大写）
   */
  convertLangCode(code: string): string {
    const map: Record<string, string> = {
      'zh-CN': 'ZH',
      'en': 'EN',
      'ja': 'JA',
      'ko': 'KO',
      'fr': 'FR',
      'de': 'DE',
      'es': 'ES',
      'ru': 'RU',
      'it': 'IT',
      'pt': 'PT',
      'nl': 'NL',
      'pl': 'PL',
    };

    return map[code] || code.toUpperCase();
  }
}
