import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants.js';
import { ConfigManager } from './config-manager.js';

/**
 * 存储管理器
 */
export class StorageManager {
  constructor() {
    this.legacyDefaults = DEFAULT_SETTINGS;
    this.configDefaults = ConfigManager.getDefaults();
    // 确保 chrome API 可用
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.error('Chrome storage API 不可用');
    }
  }

  /**
   * 获取设置
   * @returns {Promise<Object>} 设置对象
  */
  async getSettings() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用，返回默认设置');
        return { ...this.configDefaults };
      }
      const raw = await chrome.storage.sync.get(null) || {};

      const namespaced = raw?.[STORAGE_KEYS.SETTINGS];
      const rawWithoutNamespace = { ...raw };
      delete rawWithoutNamespace[STORAGE_KEYS.SETTINGS];

      // 以命名空间配置为基础，由根级最新值覆盖
      const candidate = {
        ...(namespaced && typeof namespaced === 'object' ? namespaced : {}),
        ...rawWithoutNamespace,
      };

      // 合并旧版默认值（保留快捷键等设置）
      const legacyMerged = { ...this.legacyDefaults };
      Object.keys(this.legacyDefaults).forEach((key) => {
        if (candidate[key] !== undefined) {
          legacyMerged[key] = candidate[key];
        }
      });

      // 运行迁移逻辑以适配最新结构
      const migrated = ConfigManager.migrate({ ...candidate, ...legacyMerged });

      // 覆盖配置默认值，确保关键字段存在
      return { ...this.configDefaults, ...migrated };
    } catch (error) {
      console.error('获取设置失败:', error);
      return { ...this.configDefaults };
    }
  }

  /**
   * 保存设置
   * @param {Object} settings 设置对象
   * @returns {Promise<boolean>} 是否成功
   */
  async saveSettings(settings) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      const payload = {
        ...settings,
        [STORAGE_KEYS.SETTINGS]: settings,
      };
      await chrome.storage.sync.set(payload);
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  /**
   * 获取翻译历史
   * @returns {Promise<Array>} 历史记录数组
   */
  async getHistory() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return [];
      }
      const result = await chrome.storage.local.get([STORAGE_KEYS.HISTORY]);
      return result[STORAGE_KEYS.HISTORY] || [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 保存翻译记录
   * @param {string} original 原文
   * @param {string} translated 译文
   * @param {string} sourceLang 源语言
   * @param {string} targetLang 目标语言
   * @returns {Promise<boolean>} 是否成功
   */
  async saveTranslation(original, translated, sourceLang, targetLang) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      const history = await this.getHistory();
      const newRecord = {
        id: Date.now(),
        original,
        translated,
        sourceLang,
        targetLang,
        timestamp: new Date().toISOString()
      };
      
      history.unshift(newRecord);
      
      // 只保留最近 100 条记录
      if (history.length > 100) {
        history.splice(100);
      }
      
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
      return true;
    } catch (error) {
      console.error('保存翻译记录失败:', error);
      return false;
    }
  }

  /**
   * 清空历史记录
   * @returns {Promise<boolean>} 是否成功
   */
  async clearHistory() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await chrome.storage.local.remove([STORAGE_KEYS.HISTORY]);
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @returns {Promise<Object>} 缓存对象
   */
  async getCache() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return {};
      }
      const result = await chrome.storage.local.get([STORAGE_KEYS.CACHE]);
      return result[STORAGE_KEYS.CACHE] || {};
    } catch (error) {
      console.error('获取缓存失败:', error);
      return {};
    }
  }

  /**
   * 保存缓存
   * @param {Object} cache 缓存对象
   * @returns {Promise<boolean>} 是否成功
   */
  async saveCache(cache) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await chrome.storage.local.set({ [STORAGE_KEYS.CACHE]: cache });
      return true;
    } catch (error) {
      console.error('保存缓存失败:', error);
      return false;
    }
  }

  /**
   * 清空缓存
   * @returns {Promise<boolean>} 是否成功
   */
  async clearCache() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await chrome.storage.local.remove([STORAGE_KEYS.CACHE]);
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }
}
