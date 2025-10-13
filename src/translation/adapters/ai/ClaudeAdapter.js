import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter.js';
import { COMMON_LANGUAGES } from '../../utils/language-codes.js';
import { getNativeLanguageName } from '../../utils/language-codes.js';

/**
 * Anthropic Claude 适配器
 */
export class ClaudeAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'claude',
      name: 'Anthropic Claude',
      displayName: 'Claude AI',
      description: '长文本翻译优秀，上下文理解强',
      logo: '/assets/icons/providers/claude.png',
      category: 'ai',
      supportedLanguages: COMMON_LANGUAGES.filter(l => l.code !== 'auto'),
      features: [
        { name: '长文本', description: '100K token 上下文', available: true },
        { name: '高质量', description: '翻译连贯性好', available: true },
        { name: '上下文', description: '深度理解上下文', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'usage-based',
        paidPricing: '$11.02/百万 tokens (Sonnet)',
        billingUnit: 'token',
        details: '按 token 计费，支持多个模型',
      },
      homepage: 'https://www.anthropic.com',
      documentation: 'https://docs.anthropic.com',
    });
  }

  async translate(request) {
    const model = this.config.model || 'claude-3-sonnet-20240229';
    const targetLangName = getNativeLanguageName(request.targetLang);

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = `请将以下文本翻译成${targetLangName}，只输出翻译结果：\n\n${request.text}`;

    const data = await this.retryRequest(async () => {
      return await this.makeRequest('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: this.config.maxTokens || 2000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
          ],
        }),
      });
    });

    return {
      translatedText: data.content[0].text.trim(),
      provider: 'claude',
      model: model,
      timestamp: Date.now(),
      usage: {
        tokens: data.usage.input_tokens + data.usage.output_tokens,
        cost: this.calculateCost(data.usage, model),
      },
    };
  }

  async detectLanguage(text) {
    const data = await this.makeRequest('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: `Detect the language of this text and respond with ONLY the ISO 639-1 code:\n\n${text}`,
          },
        ],
      }),
    });

    return {
      language: data.content[0].text.trim().toLowerCase(),
      confidence: 0.95,
    };
  }

  async validateApiKey() {
    try {
      await this.makeRequest('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'API Key 无效',
      };
    }
  }

  buildSystemPrompt(request) {
    let prompt = '你是一位专业的翻译专家。请准确翻译文本，保持原文的含义、语气和风格。';

    if (request.options?.formality === 'formal') {
      prompt += ' 使用正式、礼貌的语言。';
    } else if (request.options?.formality === 'informal') {
      prompt += ' 使用轻松、口语化的表达。';
    }

    if (request.options?.context) {
      prompt += ` 上下文：${request.options.context}`;
    }

    if (request.options?.domain) {
      const domains = {
        medical: '医学',
        legal: '法律',
        technical: '技术',
        finance: '金融',
      };
      prompt += ` 这是${domains[request.options.domain] || request.options.domain}领域的内容。`;
    }

    return prompt;
  }

  calculateCost(usage, model) {
    const rates = {
      'claude-3-opus-20240229': { input: 15 / 1000000, output: 75 / 1000000 },
      'claude-3-sonnet-20240229': { input: 3 / 1000000, output: 15 / 1000000 },
      'claude-3-haiku-20240307': { input: 0.25 / 1000000, output: 1.25 / 1000000 },
    };

    const rate = rates[model] || rates['claude-3-sonnet-20240229'];
    return usage.input_tokens * rate.input + usage.output_tokens * rate.output;
  }
}
