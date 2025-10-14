import { BaseTranslationAdapter } from '../base/BaseTranslationAdapter';
import { COMMON_LANGUAGES } from '../../utils/language-codes';
import type { TranslationRequest, TranslationResponse, ValidationResult } from '../../interfaces/types';
import { hmacSha256, hmacSha256Raw, sha256 } from '../../utils/crypto';

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
      supportedLanguages: COMMON_LANGUAGES.filter((l) => l.code !== 'auto'),
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

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const host = 'tmt.tencentcloudapi.com';
    const endpoint = `https://${host}`;
    const payload = {
      SourceText: request.text,
      Source: this.convertLangCode(request.sourceLang),
      Target: this.convertLangCode(request.targetLang),
      ProjectId: 0
    };
    const body = JSON.stringify(payload);
    const headers = await this.buildTencentHeaders('TextTranslate', body, host);

    const data = await this.retryRequest<any>(async () => {
      return this.makeRequest<any>(endpoint, {
        method: 'POST',
        headers,
        body
      });
    });

    if (data.Response?.Error) {
      const error = data.Response.Error;
      throw new Error(`Tencent API Error [${error.Code}]: ${error.Message}`);
    }

    return {
      translatedText: data.Response.TargetText,
      detectedSourceLanguage: data.Response.Source,
      provider: 'tencent',
      timestamp: Date.now(),
      usage: {
        characters: request.text.length
      }
    };
  }

  async detectLanguage(text: string) {
    // 使用翻译接口检测
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
        message: 'SecretId 或 SecretKey 无效',
        details: { error: (error as Error).message }
      };
    }
  }

  private async buildTencentHeaders(action: string, payload: string, host: string): Promise<Record<string, string>> {
    const secretId = this.config.apiKey ?? '';
    const secretKey = this.config.apiSecret ?? '';

    if (!secretId || !secretKey) {
      throw new Error('Tencent Translate requires SecretId (apiKey) and SecretKey (apiSecret)');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const service = 'tmt';
    const algorithm = 'TC3-HMAC-SHA256';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const signedHeaders = 'content-type;host';
    const contentType = 'application/json; charset=utf-8';

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const hashedPayload = await sha256(payload);
    const canonicalRequest = [
      'POST',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedPayload
    ].join('\n');

    const hashedCanonicalRequest = await sha256(canonicalRequest);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const credentialScope = `${date}/${service}/tc3_request`;
    const stringToSign = [
      algorithm,
      timestamp.toString(),
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');

    const secretDate = await hmacSha256Raw(`TC3${secretKey}`, date);
    const secretService = await hmacSha256Raw(secretDate, service);
    const secretSigning = await hmacSha256Raw(secretService, 'tc3_request');
    const signature = await hmacSha256(secretSigning, stringToSign);

    const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      Authorization: authorization,
      'Content-Type': contentType,
      'X-TC-Action': action,
      'X-TC-Version': '2018-03-21',
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Region': this.config.region || 'ap-guangzhou'
    };
  }

  convertLangCode(code: string): string {
    const map: Record<string, string> = {
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
