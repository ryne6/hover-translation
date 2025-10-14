import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter';
import { COMMON_LANGUAGES } from '../../utils/language-codes';
import type { TranslationRequest, TranslationResponse, ValidationResult } from '../../interfaces/types';

/**
 * Microsoft Translator 适配器
 */
export class MicrosoftTranslatorAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'microsoft',
      name: 'Microsoft Translator',
      displayName: 'Microsoft 翻译',
      description: '企业级可靠性，支持90+语言',
      logo: '/assets/icons/providers/microsoft.png',
      category: 'traditional',
      supportedLanguages: COMMON_LANGUAGES.filter((l) => l.code !== 'auto'),
      features: [
        { name: '企业级', description: '企业级可靠性和安全性', available: true },
        { name: '术语词典', description: '支持自定义术语词典', available: true },
        { name: '质量评分', description: '提供翻译质量评分', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'freemium',
        freeQuota: '200万字符/月',
        paidPricing: '$10/百万字符',
        billingUnit: 'character',
        details: 'Azure 认知服务，前 200 万字符免费',
      },
      homepage: 'https://azure.microsoft.com/services/cognitive-services/translator',
      documentation: 'https://docs.microsoft.com/azure/cognitive-services/translator',
    });
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const endpoint = this.config.endpoint || 'https://api.cognitive.microsofttranslator.com';
    const region = this.config.region || 'global';
    
    const params = new URLSearchParams({
      'api-version': '3.0',
      'to': request.targetLang,
    });

    if (request.sourceLang && request.sourceLang !== 'auto') {
      params.append('from', request.sourceLang);
    }

    const url = `${endpoint}/translate?${params.toString()}`;

    const data = await this.retryRequest<any>(async () => {
      return this.makeRequest<any>(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey ?? '',
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json'
        } as HeadersInit,
        body: JSON.stringify([{ text: request.text }])
      });
    });

    const result = data[0];

    return {
      translatedText: result.translations[0].text,
      detectedSourceLanguage: result.detectedLanguage?.language,
      confidence: result.detectedLanguage?.score,
      provider: 'microsoft',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length
      }
    };
  }

  async detectLanguage(text: string) {
    const endpoint = this.config.endpoint || 'https://api.cognitive.microsofttranslator.com';
    const region = this.config.region || 'global';
    
    const url = `${endpoint}/detect?api-version=3.0`;

    const data = await this.makeRequest<any>(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey ?? '',
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify([{ text }])
    });

    const result = data[0];

    return {
      language: result.language,
      confidence: result.score,
      alternatives: result.alternatives
    };
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 或 Region 无效',
        details: { error: (error as Error).message }
      };
    }
  }
}
