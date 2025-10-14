import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter';
import { COMMON_LANGUAGES } from '../../utils/language-codes';
import { randomHex, sha256 } from '../../utils/crypto';
import type { TranslationRequest, TranslationResponse, ValidationResult } from '../../interfaces/types';

/**
 * 有道翻译适配器
 */
export class YoudaoTranslateAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'youdao',
      name: 'Youdao Translate',
      displayName: '有道翻译',
      description: '中英互译质量高，教育场景优化',
      logo: '/assets/icons/providers/youdao.png',
      category: 'traditional',
      supportedLanguages: COMMON_LANGUAGES.filter((l) => l.code !== 'auto'),
      features: [
        { name: '中英互译', description: '中英互译质量优秀', available: true },
        { name: '教育优化', description: '针对教育场景优化', available: true },
        { name: '语音翻译', description: '支持语音翻译', available: false },
      ],
      requiresApiKey: true,
      requiresApiSecret: true,
      pricing: {
        model: 'freemium',
        freeQuota: '100元体验金',
        paidPricing: '¥48/百万字符',
        billingUnit: 'character',
        details: '新用户赠送 100 元体验金',
      },
      homepage: 'https://ai.youdao.com',
      documentation: 'https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html',
    });
  }

  /**
   * 生成签名
   */
  async generateSign(params: Record<string, string>): Promise<string> {
    const appKey = String(this.config.apiKey ?? '').trim();
    const appSecret = String(this.config.apiSecret ?? '').trim();
    if (!appKey || !appSecret) {
      throw new Error('有道翻译缺少 appKey 或 appSecret');
    }
    const salt = params.salt;
    const curtime = params.curtime;
    const q = params.q;
    
    const str = appKey + this.truncate(q) + salt + curtime + appSecret;
    return await sha256(str);
  }

  /**
   * 截断字符串（有道要求）
   */
  truncate(q: string): string {
    const len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const salt = randomHex(16);
    const curtime = Math.floor(Date.now() / 1000).toString();

    const params: Record<string, string> = {
      q: request.text,
      from: request.sourceLang === 'auto' ? 'auto' : this.convertLangCode(request.sourceLang),
      to: this.convertLangCode(request.targetLang),
      appKey: this.config.apiKey ?? '',
      salt,
      curtime
    };

    params.sign = await this.generateSign(params);
    params.signType = 'v3';

    const url = 'https://openapi.youdao.com/api';
    const formData = new URLSearchParams(params);

    const data = await this.retryRequest(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      return await response.json();
    });

    if (data.errorCode !== '0') {
      throw new Error(`Youdao API Error: ${data.errorCode}`);
    }

    return {
      translatedText: data.translation.join(''),
      detectedSourceLanguage: request.sourceLang === 'auto' ? data.l.split('2')[0] : undefined,
      provider: 'youdao',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length
      }
    };
  }

  async detectLanguage(text: string) {
    const result = await this.translate({
      text: text.substring(0, 100),
      sourceLang: 'auto',
      targetLang: 'en',
    });

    return {
      language: result.detectedSourceLanguage || 'unknown',
      confidence: 0.85
    };
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: '应用ID或密钥无效',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * 转换语言代码
   */
  convertLangCode(code: string): string {
    const map: Record<string, string> = {
      'zh-CN': 'zh-CHS',
      'zh-TW': 'zh-CHT',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'ru': 'ru',
      'it': 'it',
      'pt': 'pt',
      'ar': 'ar',
      'hi': 'hi',
      'th': 'th',
      'vi': 'vi',
    };

    return map[code] || code;
  }
}
