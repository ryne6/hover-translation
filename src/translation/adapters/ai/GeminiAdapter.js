import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter.js';
import { COMMON_LANGUAGES } from '../../utils/language-codes.js';
import { getNativeLanguageName } from '../../utils/language-codes.js';

/**
 * Google Gemini 适配器
 */
export class GeminiAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'gemini',
      name: 'Google Gemini',
      displayName: 'Gemini AI',
      description: 'Google 最新 AI 模型，免费额度高',
      logo: '/assets/icons/providers/gemini.png',
      category: 'ai',
      supportedLanguages: COMMON_LANGUAGES.filter(l => l.code !== 'auto'),
      features: [
        { name: '多模态', description: '支持图文混合翻译', available: true },
        { name: '高速', description: '响应速度快', available: true },
        { name: '免费额度', description: '免费额度很高', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'freemium',
        freeQuota: '每分钟 60 次请求',
        paidPricing: 'Flash: 免费, Pro: $7/百万 tokens',
        billingUnit: 'token',
        details: 'Gemini 1.5 Flash 免费使用',
      },
      homepage: 'https://ai.google.dev',
      documentation: 'https://ai.google.dev/docs',
    });
  }

  async translate(request) {
    const model = this.config.model || 'gemini-1.5-flash';
    const targetLangName = getNativeLanguageName(request.targetLang);
    
    const prompt = `请将以下文本翻译成${targetLangName}，只输出翻译结果，不要添加任何解释或说明：\n\n${request.text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

    const data = await this.retryRequest(async () => {
      return await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            temperature: this.config.temperature || 0.3,
            maxOutputTokens: this.config.maxTokens || 2000,
          },
        }),
      });
    });

    const translatedText = data.candidates[0].content.parts[0].text.trim();

    return {
      translatedText: translatedText,
      provider: 'gemini',
      model: model,
      timestamp: Date.now(),
      usage: {
        tokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async detectLanguage(text) {
    const prompt = `Detect the language of this text and respond with ONLY the ISO 639-1 language code:\n\n${text}`;
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

    const data = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 10,
        },
      }),
    });

    const language = data.candidates[0].content.parts[0].text.trim().toLowerCase();

    return {
      language: language,
      confidence: 0.9,
    };
  }

  async validateApiKey() {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 无效',
      };
    }
  }
}
