import type {
  AdapterConfig,
  Language,
  LanguageDetectionResult,
  ProviderInfo,
  QuotaInfo,
  TranslationRequest,
  TranslationResponse,
  ValidationResult
} from './types';

export abstract class ITranslationAdapter {
  abstract translate(request: TranslationRequest): Promise<TranslationResponse>;

  abstract detectLanguage(text: string): Promise<LanguageDetectionResult>;

  abstract configure(config: AdapterConfig): void;

  abstract validateConfig(): Promise<ValidationResult>;

  abstract getProviderInfo(): ProviderInfo;

  abstract getSupportedLanguages(): Language[];

  abstract isLanguagePairSupported(sourceLang: string, targetLang: string): boolean;

  async getQuota(): Promise<QuotaInfo | null> {
    return null;
  }

  async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const results: TranslationResponse[] = [];
    for (const request of requests) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.translate(request));
    }
    return results;
  }
}
