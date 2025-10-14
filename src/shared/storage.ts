import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import { ConfigManager, TranslationSettings } from './config-manager';

export interface TranslationHistoryItem {
  id: number;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

export type TranslationHistory = TranslationHistoryItem[];

export type TranslationCache = Record<string, unknown>;

const isChromeStorageAvailable = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome.storage;

const getFromStorage = <T>(
  area: chrome.storage.StorageArea,
  keys?: string | string[] | Record<string, unknown> | null
): Promise<T> =>
  new Promise((resolve, reject) => {
    area.get(keys ?? null, (items) => {
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        reject(lastError);
      } else {
        resolve(items as T);
      }
    });
  });

const setInStorage = (
  area: chrome.storage.StorageArea,
  items: Record<string, unknown>
): Promise<void> =>
  new Promise((resolve, reject) => {
    area.set(items, () => {
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        reject(lastError);
      } else {
        resolve();
      }
    });
  });

const removeFromStorage = (
  area: chrome.storage.StorageArea,
  keys: string | string[]
): Promise<void> =>
  new Promise((resolve, reject) => {
    area.remove(keys, () => {
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        reject(lastError);
      } else {
        resolve();
      }
    });
  });

export class StorageManager {
  private readonly legacyDefaults = DEFAULT_SETTINGS;
  private readonly configDefaults = ConfigManager.getDefaults();

  constructor() {
    if (!isChromeStorageAvailable()) {
      console.error('Chrome storage API 不可用');
    }
  }

  async getSettings(): Promise<TranslationSettings> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用，返回默认设置');
        return { ...this.configDefaults };
      }

      const raw = await getFromStorage<Record<string, unknown>>(chrome.storage.sync, null);
      const namespaced = raw?.[STORAGE_KEYS.SETTINGS];
      const rawWithoutNamespace = { ...raw };
      delete rawWithoutNamespace[STORAGE_KEYS.SETTINGS];

      const candidate = {
        ...(namespaced && typeof namespaced === 'object' ? namespaced : {}),
        ...rawWithoutNamespace
      } as TranslationSettings;

      const legacyMerged = { ...this.legacyDefaults } as Record<string, unknown>;
      Object.keys(this.legacyDefaults).forEach((key) => {
        if (candidate[key as keyof TranslationSettings] !== undefined) {
          legacyMerged[key] = candidate[key as keyof TranslationSettings];
        }
      });

      const migrated = ConfigManager.migrate({ ...candidate, ...legacyMerged });
      return { ...this.configDefaults, ...migrated };
    } catch (error) {
      console.error('获取设置失败:', error);
      return { ...this.configDefaults };
    }
  }

  async saveSettings(settings: TranslationSettings): Promise<boolean> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      const payload = {
        ...settings,
        [STORAGE_KEYS.SETTINGS]: settings
      };
      await setInStorage(chrome.storage.sync, payload);
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  async getHistory(): Promise<TranslationHistory> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return [];
      }
      const result = await getFromStorage<Record<string, TranslationHistory>>(chrome.storage.local, [
        STORAGE_KEYS.HISTORY
      ]);
      return result[STORAGE_KEYS.HISTORY] || [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  async saveTranslation(original: string, translated: string, sourceLang: string, targetLang: string): Promise<boolean> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      const history = await this.getHistory();
      const newRecord: TranslationHistoryItem = {
        id: Date.now(),
        original,
        translated,
        sourceLang,
        targetLang,
        timestamp: new Date().toISOString()
      };

      const updated = [newRecord, ...history].slice(0, 100);

      await setInStorage(chrome.storage.local, { [STORAGE_KEYS.HISTORY]: updated });
      return true;
    } catch (error) {
      console.error('保存翻译记录失败:', error);
      return false;
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await removeFromStorage(chrome.storage.local, STORAGE_KEYS.HISTORY);
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  async getCache(): Promise<TranslationCache> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return {};
      }
      const result = await getFromStorage<Record<string, TranslationCache>>(chrome.storage.local, [
        STORAGE_KEYS.CACHE
      ]);
      return result[STORAGE_KEYS.CACHE] || {};
    } catch (error) {
      console.error('获取缓存失败:', error);
      return {};
    }
  }

  async saveCache(cache: TranslationCache): Promise<boolean> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await setInStorage(chrome.storage.local, { [STORAGE_KEYS.CACHE]: cache });
      return true;
    } catch (error) {
      console.error('保存缓存失败:', error);
      return false;
    }
  }

  async clearCache(): Promise<boolean> {
    try {
      if (!isChromeStorageAvailable()) {
        console.warn('Chrome storage API 不可用');
        return false;
      }
      await removeFromStorage(chrome.storage.local, STORAGE_KEYS.CACHE);
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }
}
