/**
 * 缓存管理器
 * 管理翻译结果的缓存
 */
export class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // 最大缓存条目数
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 默认 24 小时
    this.cache = new Map();
    this.accessOrder = []; // LRU 访问顺序
  }

  /**
   * 生成缓存键
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @returns {string}
   */
  generateKey(request) {
    const { text, sourceLang, targetLang } = request;
    // 使用文本的前100个字符 + 语言对作为键
    const textKey = text.length > 100 ? text.substring(0, 100) + '...' : text;
    return `${sourceLang}:${targetLang}:${textKey}`;
  }

  /**
   * 获取缓存
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @returns {import('../interfaces/types.js').TranslationResponse|null}
   */
  async get(request) {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // 更新访问顺序（LRU）
    this.updateAccessOrder(key);

    return cached.data;
  }

  /**
   * 设置缓存
   * @param {import('../interfaces/types.js').TranslationRequest} request
   * @param {import('../interfaces/types.js').TranslationResponse} response
   */
  async set(request, response) {
    const key = this.generateKey(request);

    // 如果缓存已满，删除最久未使用的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder[0];
      this.cache.delete(oldestKey);
      this.removeFromAccessOrder(oldestKey);
    }

    this.cache.set(key, {
      data: response,
      timestamp: Date.now(),
    });

    this.updateAccessOrder(key);
  }

  /**
   * 更新访问顺序
   */
  updateAccessOrder(key) {
    // 移除旧位置
    this.removeFromAccessOrder(key);
    // 添加到末尾（最近使用）
    this.accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      usage: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%',
    };
  }

  /**
   * 删除过期缓存
   */
  cleanExpired() {
    const now = Date.now();
    const expiredKeys = [];

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

  /**
   * 根据提供商清空缓存
   * @param {string} providerId
   */
  clearByProvider(providerId) {
    let count = 0;
    const keysToDelete = [];

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
}
