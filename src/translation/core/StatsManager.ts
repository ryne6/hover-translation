import type {
  ProviderStats,
  ProviderStatsSnapshot,
  StatsSnapshot,
  TranslationResponse
} from '../interfaces/types';
import type { TranslationError } from '../interfaces/errors';

interface ProviderStatsExtended extends ProviderStats {
  responseTimes: number[];
}

interface StatsState {
  byProvider: Map<string, ProviderStatsExtended>;
  total: StatsSnapshot['total'];
  today: StatsSnapshot['today'];
  lastReset: string;
}

export class StatsManager {
  private stats: StatsState;

  constructor() {
    this.stats = {
      byProvider: new Map(),
      total: {
        requests: 0,
        successes: 0,
        failures: 0,
        characters: 0,
        cost: 0
      },
      today: {
        requests: 0,
        characters: 0,
        cost: 0
      },
      lastReset: new Date().toDateString()
    };
  }

  /**
   * 记录成功的翻译
   * @param {import('../interfaces/types').TranslationResponse} response
   */
  async recordSuccess(response: TranslationResponse): Promise<void> {
    const providerId = response.provider;

    // 初始化提供商统计
    if (!this.stats.byProvider.has(providerId)) {
      this.stats.byProvider.set(providerId, {
        requests: 0,
        successes: 0,
        failures: 0,
        characters: 0,
        tokens: 0,
        cost: 0,
        averageResponseTime: 0,
        responseTimes: []
      });
    }

    const providerStats = this.stats.byProvider.get(providerId)!;

    // 更新提供商统计
    providerStats.requests++;
    providerStats.successes++;
    
    if (response.usage) {
      if (response.usage.characters) {
        providerStats.characters += response.usage.characters;
        this.stats.total.characters += response.usage.characters;
        this.stats.today.characters += response.usage.characters;
      }
      if (response.usage.tokens) {
        providerStats.tokens += response.usage.tokens;
      }
      if (response.usage.cost) {
        providerStats.cost += response.usage.cost;
        this.stats.total.cost += response.usage.cost;
        this.stats.today.cost += response.usage.cost;
      }
    }

    // 更新总计
    this.stats.total.requests++;
    this.stats.total.successes++;
    this.stats.today.requests++;

    // 检查是否需要重置今日统计
    this.checkDailyReset();
  }

  /**
   * 记录失败的翻译
   * @param {string} providerId
   * @param {Error} error
   */
  async recordFailure(providerId: string, error: TranslationError | (Error & { code?: number })): Promise<void> {
    // 初始化提供商统计
    if (!this.stats.byProvider.has(providerId)) {
      this.stats.byProvider.set(providerId, {
        requests: 0,
        successes: 0,
        failures: 0,
        characters: 0,
        tokens: 0,
        cost: 0,
        averageResponseTime: 0,
        responseTimes: [],
        errors: []
      });
    }

    const providerStats = this.stats.byProvider.get(providerId)!;

    // 更新统计
    providerStats.requests++;
    providerStats.failures++;
    
    // 记录错误
    if (!providerStats.errors) {
      providerStats.errors = [];
    }
    providerStats.errors!.push({
      message: error.message,
      code: (error as { code?: number }).code,
      timestamp: Date.now()
    });

    // 只保留最近 10 个错误
    if (providerStats.errors.length > 10) {
      providerStats.errors = providerStats.errors.slice(-10);
    }

    // 更新总计
    this.stats.total.requests++;
    this.stats.total.failures++;
    this.stats.today.requests++;

    this.checkDailyReset();
  }

  /**
   * 记录响应时间
   * @param {string} providerId
   * @param {number} responseTime - 响应时间（毫秒）
   */
  recordResponseTime(providerId: string, responseTime: number): void {
    if (!this.stats.byProvider.has(providerId)) return;

    const providerStats = this.stats.byProvider.get(providerId)!;
    providerStats.responseTimes.push(responseTime);

    // 只保留最近 100 次的响应时间
    if (providerStats.responseTimes.length > 100) {
      providerStats.responseTimes = providerStats.responseTimes.slice(-100);
    }

    // 计算平均响应时间
    const sum = providerStats.responseTimes.reduce((a, b) => a + b, 0);
    providerStats.averageResponseTime = sum / providerStats.responseTimes.length;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats(): StatsSnapshot {
    const providerStats: Record<string, ProviderStatsSnapshot> = {};

    for (const [providerId, stats] of this.stats.byProvider) {
      providerStats[providerId] = {
        requests: stats.requests,
        successes: stats.successes,
        failures: stats.failures,
        characters: stats.characters,
        tokens: stats.tokens,
        cost: stats.cost,
        averageResponseTime: stats.averageResponseTime,
        errors: stats.errors,
        successRate:
          stats.requests > 0
            ? `${((stats.successes / stats.requests) * 100).toFixed(2)}%`
            : '0%'
      };
    }

    return {
      total: this.stats.total,
      today: this.stats.today,
      byProvider: providerStats,
      lastReset: this.stats.lastReset
    };
  }

  /**
   * 获取提供商统计
   * @param {string} providerId
   * @returns {Object|null}
   */
  getProviderStats(providerId: string): ProviderStatsSnapshot | null {
    const stats = this.stats.byProvider.get(providerId);
    if (!stats) return null;

    return {
      requests: stats.requests,
      successes: stats.successes,
      failures: stats.failures,
      characters: stats.characters,
      tokens: stats.tokens,
      cost: stats.cost,
      averageResponseTime: stats.averageResponseTime,
      errors: stats.errors,
      successRate:
        stats.requests > 0
          ? `${((stats.successes / stats.requests) * 100).toFixed(2)}%`
          : '0%'
    };
  }

  /**
   * 检查是否需要重置今日统计
   */
  private checkDailyReset(): void {
    const today = new Date().toDateString();
    if (today !== this.stats.lastReset) {
      this.stats.today = {
        requests: 0,
        characters: 0,
        cost: 0
      };
      this.stats.lastReset = today;
    }
  }

  /**
   * 清空统计
   */
  clear(): void {
    this.stats.byProvider.clear();
    this.stats.total = {
      requests: 0,
      successes: 0,
      failures: 0,
      characters: 0,
      cost: 0
    };
    this.stats.today = {
      requests: 0,
      characters: 0,
      cost: 0
    };
    this.stats.lastReset = new Date().toDateString();
  }

  /**
   * 导出统计数据
   * @returns {string} JSON 字符串
   */
  export(): string {
    const data = this.getStats();
    return JSON.stringify(data, null, 2);
  }
}
