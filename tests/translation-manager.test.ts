import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslationManager } from '../src/translation/core/TranslationManager';
import { AdapterFactory } from '../src/translation/core/AdapterFactory';
import { ITranslationAdapter } from '../src/translation/interfaces/ITranslationAdapter';
import type {
  AdapterConfig,
  Language,
  LanguageDetectionResult,
  ProviderInfo,
  TranslationManagerConfig,
  TranslationRequest,
  TranslationResponse,
  ValidationResult
} from '../src/translation/interfaces/types';

class MockAdapter extends ITranslationAdapter {
  private readonly info: ProviderInfo;

  private readonly translateImpl: (request: TranslationRequest) => Promise<TranslationResponse>;

  private readonly detectImpl: (text: string) => Promise<LanguageDetectionResult>;

  private readonly supportCheck: (source: string, target: string) => boolean;

  public configureCalls: AdapterConfig[] = [];

  constructor(
    info: ProviderInfo,
    translateImpl: (request: TranslationRequest) => Promise<TranslationResponse>,
    options: {
      detectImpl?: (text: string) => Promise<LanguageDetectionResult>;
      supportCheck?: (source: string, target: string) => boolean;
    } = {}
  ) {
    super();
    this.info = info;
    this.translateImpl = translateImpl;
    this.detectImpl =
      options.detectImpl ??
      (async () => ({
        language: 'en',
        confidence: 1
      }));
    this.supportCheck =
      options.supportCheck ??
      (() => true);
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    return this.translateImpl(request);
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    return this.detectImpl(text);
  }

  configure(config: AdapterConfig): void {
    this.configureCalls.push(config);
  }

  async validateConfig(): Promise<ValidationResult> {
    return { valid: true };
  }

  getProviderInfo(): ProviderInfo {
    return this.info;
  }

  getSupportedLanguages(): Language[] {
    return this.info.supportedLanguages;
  }

  isLanguagePairSupported(sourceLang: string, targetLang: string): boolean {
    return this.supportCheck(sourceLang, targetLang);
  }
}

const buildProviderInfo = (id: string): ProviderInfo => ({
  id,
  name: id,
  displayName: id,
  description: `${id} mock provider`,
  logo: '',
  category: 'traditional',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' }
  ],
  features: [],
  requiresApiKey: false,
  pricing: {
    model: 'freemium',
    billingUnit: 'character',
    details: 'Mock pricing'
  }
});

const buildConfig = (overrides: Partial<TranslationManagerConfig>): TranslationManagerConfig => ({
  primaryProvider: 'google',
  fallbackProviders: [],
  providers: {
    google: { enabled: true }
  },
  options: {
    autoFallback: true,
    cacheResults: true,
    parallelTranslation: true,
    retryCount: 2,
    timeout: 30_000,
    formality: 'default',
    domain: 'general'
  },
  ...overrides,
  providers: {
    google: { enabled: true },
    ...(overrides.providers ?? {})
  }
});

const stubAdapterFactory = (
  adapters: Record<string, MockAdapter>,
  recommendProvider: string = 'google'
) => {
  vi.spyOn(AdapterFactory, 'createAdapter').mockImplementation((providerId, config) => {
    const adapter = adapters[providerId];
    if (!adapter) {
      throw new Error(`Unexpected provider requested: ${providerId}`);
    }
    adapter.configure(config);
    return adapter;
  });

  vi.spyOn(AdapterFactory, 'recommendProvider').mockImplementation(() => recommendProvider);
};

describe('TranslationManager integration', () => {
  let manager: TranslationManager;

  beforeEach(() => {
    manager = new TranslationManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    AdapterFactory.clearInstances();
  });

  it('returns cached result on repeated translation requests', async () => {
    const translateMock = vi.fn<TranslationRequest[], Promise<TranslationResponse>>(async () => ({
      translatedText: '你好',
      detectedSourceLanguage: 'en',
      provider: 'google',
      timestamp: Date.now(),
      usage: {
        characters: 5
      }
    }));

    const googleAdapter = new MockAdapter(buildProviderInfo('google'), translateMock);

    stubAdapterFactory({ google: googleAdapter });

    const config = buildConfig({
      options: {
        autoFallback: true,
        cacheResults: true,
        parallelTranslation: true,
        retryCount: 2,
        timeout: 30_000,
        formality: 'default',
        domain: 'general'
      }
    });

    await manager.initialize(config);

    const request: TranslationRequest = {
      text: 'hello',
      sourceLang: 'en',
      targetLang: 'zh-CN'
    };

    const first = await manager.translate(request);
    expect(first.cached).toBeUndefined();
    expect(first.translatedText).toBe('你好');

    const second = await manager.translate(request);
    expect(second.cached).toBe(true);
    expect(second.translatedText).toBe('你好');
    expect(translateMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to secondary provider when primary fails', async () => {
    const primaryTranslate = vi
      .fn<TranslationRequest[], Promise<TranslationResponse>>()
      .mockRejectedValue(new Error('Primary failed'));

    const fallbackTranslate = vi.fn<TranslationRequest[], Promise<TranslationResponse>>(async () => ({
      translatedText: 'fallback',
      detectedSourceLanguage: 'en',
      provider: 'deepl',
      timestamp: Date.now()
    }));

    const googleAdapter = new MockAdapter(buildProviderInfo('google'), primaryTranslate);
    const deeplAdapter = new MockAdapter(buildProviderInfo('deepl'), fallbackTranslate);

    stubAdapterFactory({ google: googleAdapter, deepl: deeplAdapter });

    const config = buildConfig({
      fallbackProviders: ['deepl'],
      providers: {
        google: { enabled: true },
        deepl: { enabled: true }
      },
      options: {
        autoFallback: true,
        cacheResults: false,
        parallelTranslation: true,
        retryCount: 2,
        timeout: 30_000,
        formality: 'default',
        domain: 'general'
      }
    });

    await manager.initialize(config);

    const result = await manager.translate({
      text: 'test',
      sourceLang: 'en',
      targetLang: 'zh-CN'
    });

    expect(result.provider).toBe('deepl');
    expect(result.translatedText).toBe('fallback');
    expect(primaryTranslate).toHaveBeenCalledTimes(1);
    expect(fallbackTranslate).toHaveBeenCalledTimes(1);
  });

  it('collects parallel translations from multiple providers', async () => {
    const googleTranslate = vi.fn<TranslationRequest[], Promise<TranslationResponse>>(async () => ({
      translatedText: 'google-result',
      detectedSourceLanguage: 'en',
      provider: 'google',
      timestamp: Date.now()
    }));

    const deeplTranslate = vi.fn<TranslationRequest[], Promise<TranslationResponse>>(async () => ({
      translatedText: 'deepl-result',
      detectedSourceLanguage: 'en',
      provider: 'deepl',
      timestamp: Date.now()
    }));

    const googleAdapter = new MockAdapter(buildProviderInfo('google'), googleTranslate);
    const deeplAdapter = new MockAdapter(buildProviderInfo('deepl'), deeplTranslate);

    stubAdapterFactory({ google: googleAdapter, deepl: deeplAdapter });

    const config = buildConfig({
      fallbackProviders: ['deepl'],
      providers: {
        google: { enabled: true },
        deepl: { enabled: true }
      }
    });

    await manager.initialize(config);

    const results = await manager.parallelTranslate(
      {
        text: 'hello',
        sourceLang: 'en',
        targetLang: 'zh-CN'
      },
      ['google', 'deepl']
    );

    expect(results.size).toBe(2);
    expect(results.get('google')?.translatedText).toBe('google-result');
    expect(results.get('deepl')?.translatedText).toBe('deepl-result');
    expect(googleTranslate).toHaveBeenCalledTimes(1);
    expect(deeplTranslate).toHaveBeenCalledTimes(1);
  });
});
