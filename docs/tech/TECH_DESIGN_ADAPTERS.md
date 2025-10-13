# 技术设计文档：多翻译引擎适配器系统

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UI Layer (Popup + Content)                    │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │ Popup Config │  │ HoverBox      │  │ Translation History    │  │
│  └──────┬───────┘  └───────┬───────┘  └────────┬───────────────┘  │
│         │                  │                    │                   │
└─────────┼──────────────────┼────────────────────┼───────────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              TranslationManager (Orchestrator)                │  │
│  │  • Provider Selection    • Fallback Logic                    │  │
│  │  • Caching Strategy     • Error Handling                     │  │
│  │  • Quota Management     • Performance Monitoring             │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│         ┌─────────────────┼─────────────────┐                      │
│         │                 │                 │                      │
│         ▼                 ▼                 ▼                      │
│  ┌────────────┐   ┌─────────────┐   ┌────────────┐               │
│  │   Cache    │   │   Config    │   │   Stats    │               │
│  │  Manager   │   │  Manager    │   │  Manager   │               │
│  └────────────┘   └─────────────┘   └────────────┘               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Adapter Layer (DIP)                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │        ITranslationAdapter (Abstract Interface)            │    │
│  │  + translate()  + detectLanguage()  + validateConfig()    │    │
│  └───────────────────┬────────────────────────────────────────┘    │
│                      △ implements                                   │
│    ┌─────────────────┼─────────────────────┬──────────────────┐   │
│    │                 │                     │                  │   │
│    ▼                 ▼                     ▼                  ▼   │
│ ┌──────┐      ┌──────────┐         ┌──────────┐       ┌────────┐ │
│ │Google│      │  DeepL   │         │  OpenAI  │  ...  │ Custom │ │
│ │Adapter│     │ Adapter  │         │  Adapter │       │Adapter │ │
│ └──────┘      └──────────┘         └──────────┘       └────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External Services Layer                           │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐    │
│  │ Google │  │  DeepL │  │ OpenAI │  │  Baidu │  │   ...    │    │
│  │  API   │  │  API   │  │  API   │  │  API   │  │          │    │
│  └────────┘  └────────┘  └────────┘  └────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. 核心模块设计

### 2.1 接口定义 (interfaces.ts)

```typescript
// 翻译请求
export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  options?: TranslationOptions;
}

export interface TranslationOptions {
  formality?: 'formal' | 'informal' | 'default';
  context?: string;
  domain?: 'general' | 'medical' | 'legal' | 'technical' | 'finance';
  glossary?: Record<string, string>;
  preserveFormatting?: boolean;
}

// 翻译响应
export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  provider: string;
  model?: string;
  timestamp: number;
  usage?: {
    characters?: number;
    tokens?: number;
    cost?: number;
  };
}

// 语言检测
export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternatives?: Array<{
    language: string;
    confidence: number;
  }>;
}

// 提供商信息
export interface ProviderInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  category: 'traditional' | 'ai' | 'local';
  supportedLanguages: Language[];
  features: ProviderFeature[];
  requiresApiKey: boolean;
  requiresApiSecret?: boolean;
  pricing: PricingInfo;
  rateLimit?: RateLimitInfo;
  homepage?: string;
  documentation?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface ProviderFeature {
  name: string;
  description: string;
  available: boolean;
}

export interface PricingInfo {
  model: 'free' | 'freemium' | 'paid' | 'usage-based';
  freeQuota?: string;
  paidPricing?: string;
  billingUnit: 'character' | 'token' | 'request';
  details: string;
}

export interface RateLimitInfo {
  requestsPerSecond?: number;
  requestsPerDay?: number;
  charactersPerRequest?: number;
}

// 配额信息
export interface QuotaInfo {
  used: number;
  limit: number;
  resetAt?: Date;
  unit: 'character' | 'token' | 'request';
}

// 适配器配置
export interface AdapterConfig {
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  proxy?: ProxyConfig;
  [key: string]: any;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

// 翻译适配器接口
export interface ITranslationAdapter {
  // 核心方法
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  detectLanguage(text: string): Promise<LanguageDetectionResult>;
  
  // 配置和验证
  configure(config: AdapterConfig): void;
  validateConfig(): Promise<ValidationResult>;
  
  // 元数据
  getProviderInfo(): ProviderInfo;
  getSupportedLanguages(): Language[];
  isLanguagePairSupported(source: string, target: string): boolean;
  
  // 可选功能
  getQuota?(): Promise<QuotaInfo>;
  batchTranslate?(requests: TranslationRequest[]): Promise<TranslationResponse[]>;
  getAlternatives?(text: string, source: string, target: string): Promise<string[]>;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  details?: Record<string, any>;
}
```

### 2.2 基础适配器抽象类 (BaseTranslationAdapter.ts)

```typescript
export abstract class BaseTranslationAdapter implements ITranslationAdapter {
  protected config: AdapterConfig;
  protected providerInfo: ProviderInfo;
  protected httpClient: AxiosInstance;
  
  constructor(providerInfo: ProviderInfo) {
    this.providerInfo = providerInfo;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  configure(config: AdapterConfig): void {
    this.config = config;
    
    // 配置代理
    if (config.proxy) {
      this.httpClient.defaults.proxy = {
        host: config.proxy.host,
        port: config.proxy.port,
        auth: config.proxy.auth,
      };
    }
    
    // 配置超时
    if (config.timeout) {
      this.httpClient.defaults.timeout = config.timeout;
    }
  }
  
  getProviderInfo(): ProviderInfo {
    return this.providerInfo;
  }
  
  getSupportedLanguages(): Language[] {
    return this.providerInfo.supportedLanguages;
  }
  
  isLanguagePairSupported(source: string, target: string): boolean {
    const languages = this.getSupportedLanguages().map(l => l.code);
    return (
      (source === 'auto' || languages.includes(source)) &&
      languages.includes(target)
    );
  }
  
  async validateConfig(): Promise<ValidationResult> {
    if (this.providerInfo.requiresApiKey && !this.config.apiKey) {
      return {
        valid: false,
        message: 'API Key is required',
      };
    }
    
    if (this.providerInfo.requiresApiSecret && !this.config.apiSecret) {
      return {
        valid: false,
        message: 'API Secret is required',
      };
    }
    
    // 子类可以覆盖以添加更多验证
    return await this.validateApiKey();
  }
  
  // 子类实现
  abstract translate(request: TranslationRequest): Promise<TranslationResponse>;
  abstract detectLanguage(text: string): Promise<LanguageDetectionResult>;
  protected abstract validateApiKey(): Promise<ValidationResult>;
  
  // 通用错误处理
  protected handleError(error: any, provider: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API 返回错误
        throw new TranslationError(
          `${provider} API Error: ${error.response.data.message || error.message}`,
          error.response.status,
          provider
        );
      } else if (error.request) {
        // 网络错误
        throw new TranslationError(
          `${provider} Network Error: ${error.message}`,
          0,
          provider
        );
      }
    }
    
    throw new TranslationError(
      `${provider} Unknown Error: ${error.message}`,
      500,
      provider
    );
  }
  
  // 通用重试逻辑
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 某些错误不应该重试
        if (error instanceof TranslationError) {
          if (error.code === 401 || error.code === 403) {
            throw error;
          }
        }
        
        if (i < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, i));
        }
      }
    }
    
    throw lastError;
  }
  
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class TranslationError extends Error {
  constructor(
    message: string,
    public code: number,
    public provider: string
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}
```

### 2.3 适配器工厂 (AdapterFactory.ts)

```typescript
export class AdapterFactory {
  private static adapters: Map<string, typeof BaseTranslationAdapter> = new Map();
  private static instances: Map<string, ITranslationAdapter> = new Map();
  
  // 注册适配器类
  static registerAdapter(
    providerId: string,
    adapterClass: typeof BaseTranslationAdapter
  ): void {
    this.adapters.set(providerId, adapterClass);
  }
  
  // 创建适配器实例
  static createAdapter(
    providerId: string,
    config: AdapterConfig
  ): ITranslationAdapter {
    const AdapterClass = this.adapters.get(providerId);
    
    if (!AdapterClass) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    
    // 单例模式：每个 provider 只创建一个实例
    let instance = this.instances.get(providerId);
    
    if (!instance) {
      instance = new AdapterClass();
      this.instances.set(providerId, instance);
    }
    
    instance.configure(config);
    return instance;
  }
  
  // 获取所有可用的提供商信息
  static getAvailableProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = [];
    
    for (const [providerId, AdapterClass] of this.adapters) {
      const tempInstance = new AdapterClass();
      providers.push(tempInstance.getProviderInfo());
    }
    
    return providers;
  }
  
  // 根据语言对推荐最佳提供商
  static recommendProvider(sourceLang: string, targetLang: string): string | null {
    // 语言对偏好映射
    const preferences: Record<string, string> = {
      'zh-en': 'baidu',
      'en-zh': 'baidu',
      'zh-ja': 'youdao',
      'ja-zh': 'youdao',
      'de-en': 'deepl',
      'en-de': 'deepl',
      'fr-en': 'deepl',
      'en-fr': 'deepl',
    };
    
    const key = `${sourceLang}-${targetLang}`;
    return preferences[key] || 'google';
  }
}

// 自动注册所有适配器
AdapterFactory.registerAdapter('google', GoogleTranslateAdapter);
AdapterFactory.registerAdapter('deepl', DeepLAdapter);
AdapterFactory.registerAdapter('openai', OpenAIAdapter);
AdapterFactory.registerAdapter('baidu', BaiduTranslateAdapter);
AdapterFactory.registerAdapter('microsoft', MicrosoftTranslatorAdapter);
AdapterFactory.registerAdapter('youdao', YoudaoTranslateAdapter);
// ... 更多适配器
```

### 2.4 翻译管理器 (TranslationManager.ts)

```typescript
export class TranslationManager {
  private config: TranslationManagerConfig;
  private adapters: Map<string, ITranslationAdapter> = new Map();
  private cacheManager: CacheManager;
  private statsManager: StatsManager;
  
  constructor() {
    this.cacheManager = new CacheManager();
    this.statsManager = new StatsManager();
  }
  
  async initialize(config: TranslationManagerConfig): Promise<void> {
    this.config = config;
    
    // 初始化所有已配置的适配器
    for (const [providerId, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig.enabled) {
        try {
          const adapter = AdapterFactory.createAdapter(providerId, providerConfig);
          const validation = await adapter.validateConfig();
          
          if (validation.valid) {
            this.adapters.set(providerId, adapter);
            console.log(`✓ ${providerId} adapter initialized`);
          } else {
            console.warn(`✗ ${providerId} validation failed: ${validation.message}`);
          }
        } catch (error) {
          console.error(`✗ ${providerId} initialization failed:`, error);
        }
      }
    }
  }
  
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // 1. 检查缓存
    if (this.config.options.cacheResults) {
      const cached = await this.cacheManager.get(request);
      if (cached) {
        console.log('Cache hit');
        return cached;
      }
    }
    
    // 2. 选择提供商
    const providerId = this.selectProvider(request);
    
    // 3. 执行翻译（带自动降级）
    try {
      const response = await this.translateWithFallback(request, providerId);
      
      // 4. 缓存结果
      if (this.config.options.cacheResults) {
        await this.cacheManager.set(request, response);
      }
      
      // 5. 记录统计
      await this.statsManager.recordSuccess(response);
      
      return response;
    } catch (error) {
      await this.statsManager.recordFailure(providerId, error);
      throw error;
    }
  }
  
  private selectProvider(request: TranslationRequest): string {
    // 1. 使用用户指定的提供商
    if (request.options?.preferredProvider) {
      const adapter = this.adapters.get(request.options.preferredProvider);
      if (adapter && adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        return request.options.preferredProvider;
      }
    }
    
    // 2. 检查语言对偏好
    const pairKey = `${request.sourceLang}-${request.targetLang}`;
    if (this.config.languagePairPreferences?.[pairKey]) {
      const preferredProvider = this.config.languagePairPreferences[pairKey];
      if (this.adapters.has(preferredProvider)) {
        return preferredProvider;
      }
    }
    
    // 3. 使用推荐提供商
    const recommended = AdapterFactory.recommendProvider(
      request.sourceLang,
      request.targetLang
    );
    if (recommended && this.adapters.has(recommended)) {
      return recommended;
    }
    
    // 4. 使用主要提供商
    if (this.adapters.has(this.config.primaryProvider)) {
      return this.config.primaryProvider;
    }
    
    // 5. 使用第一个可用的提供商
    const firstProvider = Array.from(this.adapters.keys())[0];
    if (firstProvider) {
      return firstProvider;
    }
    
    throw new Error('No translation provider available');
  }
  
  private async translateWithFallback(
    request: TranslationRequest,
    primaryProviderId: string
  ): Promise<TranslationResponse> {
    const providers = [primaryProviderId, ...this.config.fallbackProviders];
    let lastError: any;
    
    for (const providerId of providers) {
      const adapter = this.adapters.get(providerId);
      
      if (!adapter) continue;
      
      if (!adapter.isLanguagePairSupported(request.sourceLang, request.targetLang)) {
        continue;
      }
      
      try {
        console.log(`Translating with ${providerId}...`);
        const response = await adapter.translate(request);
        
        if (providerId !== primaryProviderId) {
          console.log(`Fallback to ${providerId} succeeded`);
        }
        
        return response;
      } catch (error) {
        console.error(`${providerId} failed:`, error);
        lastError = error;
        
        if (!this.config.options.autoFallback) {
          throw error;
        }
        
        // 继续尝试下一个提供商
        continue;
      }
    }
    
    throw lastError || new Error('All translation providers failed');
  }
  
  async detectLanguage(text: string, providerId?: string): Promise<LanguageDetectionResult> {
    const id = providerId || this.config.primaryProvider;
    const adapter = this.adapters.get(id);
    
    if (!adapter) {
      throw new Error(`Provider not found: ${id}`);
    }
    
    return adapter.detectLanguage(text);
  }
  
  async parallelTranslate(
    request: TranslationRequest,
    providerIds: string[]
  ): Promise<Map<string, TranslationResponse>> {
    const results = new Map<string, TranslationResponse>();
    
    const promises = providerIds.map(async (providerId) => {
      const adapter = this.adapters.get(providerId);
      if (!adapter) return;
      
      try {
        const response = await adapter.translate(request);
        results.set(providerId, response);
      } catch (error) {
        console.error(`${providerId} parallel translation failed:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    return results;
  }
  
  getAvailableProviders(): ProviderInfo[] {
    return Array.from(this.adapters.values()).map(adapter => 
      adapter.getProviderInfo()
    );
  }
  
  async getQuota(providerId: string): Promise<QuotaInfo | null> {
    const adapter = this.adapters.get(providerId);
    if (!adapter || !adapter.getQuota) {
      return null;
    }
    
    return adapter.getQuota();
  }
}

export interface TranslationManagerConfig {
  primaryProvider: string;
  fallbackProviders: string[];
  providers: Record<string, AdapterConfig & { enabled: boolean }>;
  options: {
    autoFallback: boolean;
    cacheResults: boolean;
    parallelTranslation: boolean;
    retryCount: number;
    timeout: number;
  };
  languagePairPreferences?: Record<string, string>;
}
```

## 3. 具体适配器实现示例

### 3.1 Google Translate 适配器

```typescript
export class GoogleTranslateAdapter extends BaseTranslationAdapter {
  private readonly ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
  
  constructor() {
    super({
      id: 'google',
      name: 'Google Translate',
      displayName: 'Google 翻译',
      description: '支持最多语言的翻译服务',
      logo: '/icons/google.png',
      category: 'traditional',
      supportedLanguages: GOOGLE_LANGUAGES,
      features: [
        { name: '自动检测', description: '自动识别源语言', available: true },
        { name: '批量翻译', description: '支持多文本翻译', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'usage-based',
        paidPricing: '$20/百万字符',
        billingUnit: 'character',
        details: 'Pay as you go',
      },
    });
  }
  
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.post(this.ENDPOINT, {
        q: request.text,
        source: request.sourceLang === 'auto' ? undefined : request.sourceLang,
        target: request.targetLang,
        format: 'text',
        key: this.config.apiKey,
      });
      
      const data = response.data.data.translations[0];
      
      return {
        translatedText: data.translatedText,
        detectedSourceLanguage: data.detectedSourceLanguage,
        provider: 'google',
        timestamp: Date.now(),
        usage: {
          characters: request.text.length,
        },
      };
    } catch (error) {
      this.handleError(error, 'Google Translate');
    }
  }
  
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const response = await this.httpClient.post(
        'https://translation.googleapis.com/language/translate/v2/detect',
        {
          q: text,
          key: this.config.apiKey,
        }
      );
      
      const detection = response.data.data.detections[0][0];
      
      return {
        language: detection.language,
        confidence: detection.confidence,
      };
    } catch (error) {
      this.handleError(error, 'Google Translate');
    }
  }
  
  protected async validateApiKey(): Promise<ValidationResult> {
    try {
      await this.detectLanguage('test');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid API key',
        details: { error: error.message },
      };
    }
  }
}
```

### 3.2 OpenAI 适配器

```typescript
export class OpenAIAdapter extends BaseTranslationAdapter {
  private readonly ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  
  constructor() {
    super({
      id: 'openai',
      name: 'OpenAI',
      displayName: 'OpenAI GPT',
      description: 'AI 驱动的高质量翻译',
      logo: '/icons/openai.png',
      category: 'ai',
      supportedLanguages: ALL_LANGUAGES, // GPT 支持几乎所有语言
      features: [
        { name: '上下文理解', description: '理解语境和文化', available: true },
        { name: '自定义风格', description: '可指定翻译风格', available: true },
        { name: '术语解释', description: '可解释专业术语', available: true },
      ],
      requiresApiKey: true,
      pricing: {
        model: 'usage-based',
        paidPricing: 'GPT-4: $0.03/1K tokens, GPT-3.5: $0.002/1K tokens',
        billingUnit: 'token',
        details: 'Token-based pricing',
      },
    });
  }
  
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const model = this.config.model || 'gpt-3.5-turbo';
    
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = `请将以下文本翻译成${this.getLanguageName(request.targetLang)}:\n\n${request.text}`;
    
    try {
      const response = await this.httpClient.post(
        this.ENDPOINT,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.config.temperature || 0.3,
          max_tokens: this.config.maxTokens || 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );
      
      const result = response.data.choices[0].message.content.trim();
      
      return {
        translatedText: result,
        provider: 'openai',
        model,
        timestamp: Date.now(),
        usage: {
          tokens: response.data.usage.total_tokens,
          cost: this.calculateCost(response.data.usage, model),
        },
      };
    } catch (error) {
      this.handleError(error, 'OpenAI');
    }
  }
  
  private buildSystemPrompt(request: TranslationRequest): string {
    let prompt = `You are a professional translator. Translate accurately while preserving the original meaning, tone, and style.`;
    
    if (request.options?.formality === 'formal') {
      prompt += ' Use formal language in the translation.';
    } else if (request.options?.formality === 'informal') {
      prompt += ' Use casual, informal language in the translation.';
    }
    
    if (request.options?.context) {
      prompt += ` Context: ${request.options.context}`;
    }
    
    if (request.options?.domain) {
      prompt += ` This is ${request.options.domain} content.`;
    }
    
    return prompt;
  }
  
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const response = await this.httpClient.post(
        this.ENDPOINT,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Detect the language of this text and respond with ONLY the ISO 639-1 language code:\n\n${text}`,
            },
          ],
          temperature: 0,
          max_tokens: 10,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );
      
      const language = response.data.choices[0].message.content.trim().toLowerCase();
      
      return {
        language,
        confidence: 0.95,
      };
    } catch (error) {
      this.handleError(error, 'OpenAI');
    }
  }
  
  protected async validateApiKey(): Promise<ValidationResult> {
    try {
      await this.httpClient.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid API key',
      };
    }
  }
  
  private calculateCost(usage: any, model: string): number {
    const rates = {
      'gpt-4': 0.03 / 1000,
      'gpt-3.5-turbo': 0.002 / 1000,
    };
    
    const rate = rates[model] || rates['gpt-3.5-turbo'];
    return usage.total_tokens * rate;
  }
  
  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'zh': '中文',
      'zh-CN': '简体中文',
      'en': 'English',
      'ja': '日语',
      // ...
    };
    return names[code] || code;
  }
}
```

## 4. 文件结构

```
src/
├── translation/
│   ├── interfaces/
│   │   ├── ITranslationAdapter.ts
│   │   ├── types.ts
│   │   └── errors.ts
│   ├── adapters/
│   │   ├── base/
│   │   │   └── BaseTranslationAdapter.ts
│   │   ├── traditional/
│   │   │   ├── GoogleTranslateAdapter.ts
│   │   │   ├── DeepLAdapter.ts
│   │   │   ├── BaiduTranslateAdapter.ts
│   │   │   ├── YoudaoTranslateAdapter.ts
│   │   │   ├── MicrosoftTranslatorAdapter.ts
│   │   │   └── TencentTranslateAdapter.ts
│   │   ├── ai/
│   │   │   ├── OpenAIAdapter.ts
│   │   │   ├── ClaudeAdapter.ts
│   │   │   ├── GeminiAdapter.ts
│   │   │   ├── ErnieAdapter.ts
│   │   │   ├── SparkAdapter.ts
│   │   │   └── QwenAdapter.ts
│   │   └── local/
│   │       ├── LibreTranslateAdapter.ts
│   │       └── ArgosTranslateAdapter.ts
│   ├── core/
│   │   ├── TranslationManager.ts
│   │   ├── AdapterFactory.ts
│   │   ├── CacheManager.ts
│   │   └── StatsManager.ts
│   ├── utils/
│   │   ├── language-codes.ts
│   │   ├── provider-info.ts
│   │   └── validators.ts
│   └── index.ts
```

## 5. 下一步实现计划

1. ✅ 创建接口定义
2. ✅ 实现基础适配器类
3. ✅ 实现适配器工厂
4. ✅ 实现翻译管理器
5. ⏳ 实现 Google、DeepL、OpenAI 适配器
6. ⏳ 实现配置页面 UI
7. ⏳ 实现缓存管理器
8. ⏳ 实现统计管理器
9. ⏳ 添加更多适配器
10. ⏳ 编写单元测试

---

**文档版本**: v1.0  
**创建日期**: 2025-10-11  
**审核状态**: Draft
