import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter';
import { COMMON_LANGUAGES } from '../../utils/language-codes';
import { md5 } from '../../utils/crypto';
import type { TranslationRequest, TranslationResponse, ValidationResult } from '../../interfaces/types';

/**
 * 百度翻译适配器
 */
export class BaiduTranslateAdapter extends BaseTranslationAdapter {
  constructor() {
    super({
      id: 'baidu',
      name: 'Baidu Translate',
      displayName: '百度翻译',
      description: '中文翻译质量高，国内访问速度快',
      logo: '/assets/icons/providers/baidu.png',
      category: 'traditional',
      supportedLanguages: COMMON_LANGUAGES.filter((l) => l.code !== 'auto'),
      features: [
        { name: '中文优化', description: '中文翻译质量优秀', available: true },
        { name: '垂直领域', description: '支持专业领域翻译', available: true },
        { name: '国内优化', description: '国内访问速度快', available: true },
      ],
      requiresApiKey: true,
      requiresApiSecret: true,
      pricing: {
        model: 'freemium',
        freeQuota: '5万字符/月',
        paidPricing: '¥49/百万字符',
        billingUnit: 'character',
        details: '标准版每月5万字符免费额度',
      },
      homepage: 'https://fanyi-api.baidu.com',
      documentation: 'https://fanyi-api.baidu.com/doc/21',
    });
  }

  /**
   * 生成签名
   */
  generateSign(query: string, salt: number): string {
    const appid = this.config.apiKey ?? '';
    const key = this.config.apiSecret ?? '';
    const str = appid + query + salt + key;
    return md5(str);
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const salt = Date.now();
    const sign = this.generateSign(request.text, salt);

    const params = {
      q: request.text,
      from: request.sourceLang === 'auto' ? 'auto' : this.convertLangCode(request.sourceLang),
      to: this.convertLangCode(request.targetLang),
      appid: this.config.apiKey ?? '',
      salt,
      sign
    };

    const url = new URL('https://fanyi-api.baidu.com/api/trans/vip/translate');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const data = await this.retryRequest<any>(async () => {
      return this.makeRequest<any>(url.toString(), {
        method: 'GET'
      });
    });

    if (data.error_code) {
      throw new Error(`Baidu API Error: ${data.error_msg}`);
    }

    return {
      translatedText: data.trans_result[0].dst,
      detectedSourceLanguage: request.sourceLang === 'auto' ? data.from : undefined,
      provider: 'baidu',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length
      }
    };
  }

  async detectLanguage(text: string) {
    const salt = Date.now();
    const sign = this.generateSign(text, salt);

    const params = {
      q: text,
      appid: this.config.apiKey ?? '',
      salt,
      sign
    };

    const url = new URL('https://fanyi-api.baidu.com/api/trans/vip/language');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const data = await this.makeRequest<any>(url.toString(), {
      method: 'GET'
    });

    return {
      language: this.convertLangCode(data.data.src, true),
      confidence: 0.9
    };
  }

  async validateApiKey(): Promise<ValidationResult> {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'APP ID 或密钥无效',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * 转换语言代码（百度使用不同的语言代码）
   */
  convertLangCode(code: string, reverse = false): string {
    const map: Record<string, string> = {
      'zh-CN': 'zh',
      'zh-TW': 'cht',
      'en': 'en',
      'ja': 'jp',
      'ko': 'kor',
      'fr': 'fra',
      'de': 'de',
      'es': 'spa',
      'ru': 'ru',
      'it': 'it',
      'pt': 'pt',
      'ar': 'ara',
      'hi': 'hi',
      'th': 'th',
      'vi': 'vie',
    };

    if (reverse) {
      const reverseMap = Object.fromEntries(
        Object.entries(map).map(([k, v]) => [v, k])
      );
      return reverseMap[code] || code;
    }

    return map[code] || code;
  }
}
