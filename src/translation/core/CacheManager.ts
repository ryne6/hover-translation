import type { TranslationRequest, TranslationResponse } from '../interfaces/types';

export interface CacheManagerOptions {
  maxSize?: number;
  ttl?: number;
}

interface CacheEntry {
  data: TranslationResponse;
  timestamp: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  ttl: number;
  usage: string;
}

export class CacheManager {
  private readonly maxSize: number;

  private readonly ttl: number;

  private readonly cache: Map<string, CacheEntry>;

  private accessOrder: string[];

  constructor(options: CacheManagerOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 24 * 60 * 60 * 1000;
    this.cache = new Map();
    this.accessOrder = [];
  }

  generateKey(request: TranslationRequest): string {
    const { text, sourceLang, targetLang } = request;
    const textKey = text.length > 100 ? `${text.substring(0, 100)}...` : text;
    return `${sourceLang}:${targetLang}:${textKey}`;
  }

  async get(request: TranslationRequest): Promise<TranslationResponse | null> {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    this.updateAccessOrder(key);
    return cached.data;
  }

  async set(request: TranslationRequest, response: TranslationResponse): Promise<void> {
    const key = this.generateKey(request);

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.removeFromAccessOrder(oldestKey);
      }
    }

    this.cache.set(key, {
      data: response,
      timestamp: Date.now()
    });

    this.updateAccessOrder(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      usage: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`
    };
  }

  cleanExpired(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }

    return expiredKeys.length;
  }

  clearByProvider(providerId: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache) {
      if (value.data.provider === providerId) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      count++;
    }

    return count;
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}
