import type { SupportedLanguageCode } from '../../shared/constants';

export type FormalityOption = 'formal' | 'informal' | 'default';
export type DomainOption = 'general' | 'medical' | 'legal' | 'technical' | 'finance' | string;
export type ProviderCategory = 'traditional' | 'ai' | 'local';
export type PricingModel = 'free' | 'freemium' | 'paid' | 'usage-based';
export type BillingUnit = 'character' | 'token' | 'request';

export interface TranslationOptions {
  formality?: FormalityOption;
  context?: string;
  domain?: DomainOption;
  glossary?: Record<string, string>;
  preserveFormatting?: boolean;
  preferredProvider?: string;
}

export interface TranslationRequest {
  text: string;
  sourceLang: SupportedLanguageCode | 'auto' | string;
  targetLang: SupportedLanguageCode | string;
  options?: TranslationOptions;
}

export interface AlternativeTranslation {
  text: string;
  confidence: number;
}

export interface UsageInfo {
  characters?: number;
  tokens?: number;
  cost?: number;
}

export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: SupportedLanguageCode | string;
  confidence?: number;
  alternatives?: AlternativeTranslation[];
  provider: string;
  model?: string;
  timestamp: number;
  usage?: UsageInfo;
  cached?: boolean;
}

export interface LanguageDetectionResult {
  language: SupportedLanguageCode | string;
  confidence: number;
  alternatives?: Array<{ language: string; confidence: number }>;
}

export interface Language {
  code: SupportedLanguageCode | string;
  name: string;
  nativeName: string;
}

export interface ProviderFeature {
  name: string;
  description: string;
  available: boolean;
}

export interface PricingInfo {
  model: PricingModel;
  freeQuota?: string;
  paidPricing?: string;
  billingUnit: BillingUnit;
  details: string;
}

export interface RateLimitInfo {
  requestsPerSecond?: number;
  requestsPerDay?: number;
  charactersPerRequest?: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  category: ProviderCategory;
  supportedLanguages: Language[];
  features: ProviderFeature[];
  requiresApiKey: boolean;
  requiresApiSecret?: boolean;
  pricing: PricingInfo;
  rateLimit?: RateLimitInfo;
  homepage?: string;
  documentation?: string;
}

export interface ProxyAuthConfig {
  username: string;
  password: string;
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: ProxyAuthConfig;
}

export interface AdapterConfig {
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  proxy?: ProxyConfig;
  region?: string;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  resetAt?: Date;
  unit: BillingUnit;
}

export interface ManagerOptions {
  autoFallback: boolean;
  cacheResults: boolean;
  parallelTranslation: boolean;
  retryCount: number;
  timeout: number;
  formality: string;
  domain: string;
}

export interface ProviderEntryConfig extends AdapterConfig {
  enabled: boolean;
}

export interface TranslationManagerConfig {
  primaryProvider: string;
  fallbackProviders: string[];
  providers: Record<string, ProviderEntryConfig>;
  options: ManagerOptions;
  languagePairPreferences?: Record<string, string>;
}

export interface ParallelTranslationResults {
  [providerId: string]: TranslationResponse;
}

export interface ProviderStatsErrorEntry {
  message: string;
  code?: number;
  timestamp: number;
}

export interface ProviderStats {
  requests: number;
  successes: number;
  failures: number;
  characters: number;
  tokens: number;
  cost: number;
  averageResponseTime: number;
  responseTimes: number[];
  errors?: ProviderStatsErrorEntry[];
}

export interface ProviderStatsSnapshot extends Omit<ProviderStats, 'responseTimes'> {
  successRate: string;
}

export interface TotalStats {
  requests: number;
  successes: number;
  failures: number;
  characters: number;
  cost: number;
}

export interface TodayStats {
  requests: number;
  characters: number;
  cost: number;
}

export interface StatsSnapshot {
  total: TotalStats;
  today: TodayStats;
  byProvider: Record<string, ProviderStatsSnapshot>;
  lastReset: string;
}
