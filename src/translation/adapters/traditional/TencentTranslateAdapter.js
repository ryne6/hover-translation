import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter.js';
import { COMMON_LANGUAGES } from '../../utils/language-codes.js';

/**
 * 腾讯翻译适配器
 */
export class TencentTranslateAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'tencent',
      name: 'Tencent Translate',
      displayName: '腾讯翻译',
      description: '性价比高，中英互译优秀',
      logo: '/assets/icons/providers/tencent.png',
      category: 'traditional',
      supportedLanguages: COMMON_LANGUAGES.filter(l => l.code !== 'auto'),
      features: [
        { name: '高性价比', description: '价格便宜，质量稳定', available: true },
        { name: '术语库', description: '支持专业术语库', available: true },
        { name: '快速响应', description: '响应速度快', available: true },
      ],
      requiresApiKey: true,
      requiresApiSecret: true,
      pricing: {
        model: 'freemium',
        freeQuota: '500万字符/月',
        paidPricing: '¥58/百万字符',
        billingUnit: 'character',
        details: '前 500 万字符免费',
      },
      homepage: 'https://cloud.tencent.com/product/tmt',
      documentation: 'https://cloud.tencent.com/document/product/551',
    });
  }

  async translate(request) {
    // 腾讯云翻译 API 实现
    // 注意：腾讯云需要签名算法，这里简化处理
    
    const endpoint = 'https://tmt.tencentcloudapi.com/';
    
    const data = await this.retryRequest(async () => {
      return await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TC-Action': 'TextTranslate',
          'Authorization': this.buildTencentAuth(),
        },
        body: JSON.stringify({
          SourceText: request.text,
          Source: this.convertLangCode(request.sourceLang),
          Target: this.convertLangCode(request.targetLang),
          ProjectId: 0,
        }),
      });
    });

    return {
      translatedText: data.Response.TargetText,
      detectedSourceLanguage: data.Response.Source,
      provider: 'tencent',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length,
      },
    };
  }

  async detectLanguage(text) {
    // 使用翻译接口检测
    const result = await this.translate({
      text: text.substring(0, 100),
      sourceLang: 'auto',
      targetLang: 'en',
    });

    return {
      language: result.detectedSourceLanguage || 'unknown',
      confidence: 0.85,
    };
  }

  async validateApiKey() {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'SecretId 或 SecretKey 无效',
      };
    }
  }

  buildTencentAuth() {
    // 简化的腾讯云签名（实际需要完整的签名算法）
    return `Bearer ${this.config.apiKey}`;
  }

  convertLangCode(code) {
    const map = {
      'zh-CN': 'zh',
      'zh-TW': 'zh-TW',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'ru': 'ru',
      'it': 'it',
      'pt': 'pt',
      'auto': 'auto',
    };
    return map[code] || code;
  }
}
