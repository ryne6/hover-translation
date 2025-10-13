import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter.js';
import { COMMON_LANGUAGES } from '../../utils/language-codes.js';
import { getNativeLanguageName } from '../../utils/language-codes.js';

/**
 * OpenAI GPT 适配器
 */
export class OpenAIAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'openai',
      name: 'OpenAI GPT',
      displayName: 'OpenAI GPT',
      description: 'AI 驱动的高质量翻译，理解上下文和文化差异',
      logo: '/assets/icons/providers/openai.png',
      category: 'ai',
      supportedLanguages: COMMON_LANGUAGES.filter(l => l.code !== 'auto'),
      features: [
        { name: '上下文理解', description: '深度理解语境和文化', available: true },
        { name: '自定义风格', description: '可指定翻译风格和领域', available: true },
        { name: '术语解释', description: '可解释专业术语', available: true },
        { name: '自然流畅', description: '翻译结果最接近自然表达', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'usage-based',
        paidPricing: 'GPT-4: $0.03/1K tokens, GPT-3.5: $0.002/1K tokens',
        billingUnit: 'token',
        details: '按 token 计费，支持多个模型',
      },
      homepage: 'https://openai.com',
      documentation: 'https://platform.openai.com/docs',
    });
  }

  async translate(request) {
    const model = this.config.model || 'gpt-3.5-turbo';
    const systemPrompt = this.buildSystemPrompt(request);
    const targetLangName = getNativeLanguageName(request.targetLang);
    
    const userPrompt = `请将以下文本翻译成${targetLangName}，只需输出翻译结果，不要添加任何解释：\n\n${request.text}`;

    const data = await this.retryRequest(async () => {
      return await this.makeRequest('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.config.temperature || 0.3,
          max_tokens: this.config.maxTokens || 2000,
        }),
      });
    });

    const translatedText = data.choices[0].message.content.trim();
    const usage = data.usage;

    return {
      translatedText: translatedText,
      provider: 'openai',
      model: model,
      timestamp: Date.now(),
      usage: {
        tokens: usage.total_tokens,
        cost: this.calculateCost(usage, model),
      },
    };
  }

  async detectLanguage(text) {
    const data = await this.makeRequest('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., "en", "zh", "ja"). Text:\n\n${text}`,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    const language = data.choices[0].message.content.trim().toLowerCase();

    return {
      language: language,
      confidence: 0.95,
    };
  }

  async validateApiKey() {
    try {
      await this.makeRequest('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 无效',
        details: { error: error.message },
      };
    }
  }

  /**
   * 构建系统提示词
   */
  buildSystemPrompt(request) {
    let prompt = '你是一位专业的翻译专家。请准确翻译文本，保持原文的含义、语气和风格。';

    if (request.options?.formality === 'formal') {
      prompt += ' 使用正式、礼貌的语言风格。';
    } else if (request.options?.formality === 'informal') {
      prompt += ' 使用轻松、口语化的表达方式。';
    }

    if (request.options?.context) {
      prompt += ` 上下文信息：${request.options.context}`;
    }

    if (request.options?.domain) {
      const domainNames = {
        medical: '医学',
        legal: '法律',
        technical: '技术',
        finance: '金融',
        general: '通用',
      };
      const domainName = domainNames[request.options.domain] || request.options.domain;
      prompt += ` 这是${domainName}领域的内容。`;
    }

    if (request.options?.glossary && Object.keys(request.options.glossary).length > 0) {
      prompt += ' 术语对照：' + JSON.stringify(request.options.glossary);
    }

    return prompt;
  }

  /**
   * 计算成本
   */
  calculateCost(usage, model) {
    const rates = {
      'gpt-4': 0.03 / 1000,
      'gpt-4-turbo': 0.01 / 1000,
      'gpt-3.5-turbo': 0.002 / 1000,
    };

    const rate = rates[model] || rates['gpt-3.5-turbo'];
    return usage.total_tokens * rate;
  }
}
