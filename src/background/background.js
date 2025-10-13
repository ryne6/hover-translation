import { APIManager } from './api-manager.js';
import { StorageManager } from '../shared/storage.js';
import { ConfigManager } from '../shared/config-manager.js';
import { Logger } from '../shared/logger.js';
import { AdapterFactory } from '../translation/core/AdapterFactory.js';

/**
 * 后台服务工作者
 * 集成多翻译引擎系统
 */
class BackgroundService {
  constructor() {
    // 1. 首先初始化 AdapterFactory（注册所有适配器）
    Logger.log('BackgroundService', 'Initializing AdapterFactory...');
    AdapterFactory.initialize();

    // 2. 初始化管理器
    this.apiManager = new APIManager();
    this.storageManager = new StorageManager();
    this.initialized = false;
    this.readyPromise = null;

    // 3. 注册监听器（必须在 Service Worker 启动时同步完成）
    this.registerMessageHandlers();
    this.registerStorageHandlers();
    this.registerInstallHandlers();
    this.registerActionHandlers();

    // 4. 启动初始化
    this.readyPromise = this.init();
  }

  /**
   * 初始化后台服务
   */
  async init() {
    Logger.log('BackgroundService', 'Starting initialization...');

    // 检查 Chrome API 是否可用
    if (typeof chrome === 'undefined') {
      Logger.error('BackgroundService', 'Chrome API not available');
      return;
    }

    // 加载用户配置
    try {
      let settings = await this.storageManager.getSettings();
      Logger.log('BackgroundService', 'Loaded settings from storage', {
        hasProviders: !!settings.providers,
        providersCount: Object.keys(settings.providers || {}).length,
      });

      // 迁移旧配置（如果需要）
      settings = ConfigManager.migrate(settings);

      // 验证配置
      const validation = ConfigManager.validate(settings);
      if (validation.valid) {
        Logger.success('BackgroundService', 'Configuration valid');
        ConfigManager.logConfig(settings);
        
        // 初始化翻译管理器
        await this.initializeTranslation(settings);
      } else {
        Logger.warn('BackgroundService', 'Invalid configuration', validation.message);
        Logger.warn('BackgroundService', 'Translation service not initialized');
        this.initialized = false;
      }
    } catch (error) {
      Logger.error('BackgroundService', 'Failed to initialize translation manager', error);
      this.initialized = false;
      throw error;
    }

    Logger.success('BackgroundService', 'Background service initialized');
  }

  /**
   * 确保后台已初始化
   */
  async ensureReady() {
    if (this.initialized) {
      return;
    }

    if (this.readyPromise) {
      try {
        await this.readyPromise;
      } catch (error) {
        Logger.warn('BackgroundService', 'Previous initialization failed, retrying...');
      }
    }

    if (!this.initialized) {
      this.readyPromise = this.init();
      await this.readyPromise.catch((error) => {
        Logger.error('BackgroundService', 'Initialization retry failed', error);
      });
    }
  }

  /**
   * 使用指定配置初始化翻译管理器
   * @param {Object} settings
   */
  async initializeTranslation(settings) {
    this.initialized = false;
    const promise = this.apiManager.initialize(settings);
    this.readyPromise = promise;
    await promise;
    this.initialized = true;
  }

  /**
   * 注册消息监听器
   */
  registerMessageHandlers() {
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // 保持消息通道开放
      });
      Logger.log('BackgroundService', 'Message handlers registered');
    }
  }

  /**
   * 注册存储变化监听器
   */
  registerStorageHandlers() {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        this.handleStorageChange(changes, namespace);
      });
      Logger.log('BackgroundService', 'Storage handlers registered');
    }
  }

  /**
   * 注册安装监听器
   */
  registerInstallHandlers() {
    if (chrome.runtime && chrome.runtime.onInstalled) {
      chrome.runtime.onInstalled.addListener((details) => {
        this.handleInstall(details);
      });
      Logger.log('BackgroundService', 'Install handlers registered');
    }
  }

  /**
   * 注册图标点击监听器
   */
  registerActionHandlers() {
    if (chrome.action && chrome.action.onClicked) {
      chrome.action.onClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
      });
      Logger.log('BackgroundService', 'Action handlers registered');
    }
  }

  /**
   * 处理消息
   */
  async handleMessage(request, sender, sendResponse) {
    const action = request.action;
    Logger.log('BackgroundService', `Received message: ${action}`);

    try {
      switch (action) {
        case 'translate': {
          await this.ensureReady();
          const result = await this.apiManager.translate(
            request.text,
            request.sourceLang,
            request.targetLang
          );
          sendResponse({ success: true, data: result });
          break;
        }

        case 'detectLanguage': {
          const detectedLang = await this.apiManager.detectLanguage(request.text);
          sendResponse({ success: true, data: detectedLang });
          break;
        }

        case 'getSettings': {
          const settings = await this.storageManager.getSettings();
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'saveSettings': {
          const saved = await this.storageManager.saveSettings(request.settings);
          sendResponse({ success: saved });
          break;
        }

        case 'updateTranslationConfig': {
          Logger.group('BackgroundService', 'Updating translation config');
          try {
            const validation = ConfigManager.validate(request.settings);
            if (!validation.valid) {
              Logger.error('BackgroundService', 'Invalid configuration', validation.message);
              sendResponse({ success: false, error: validation.message });
              break;
            }

            await this.storageManager.saveSettings(request.settings);
            Logger.success('BackgroundService', 'Settings saved to storage');

            await this.initializeTranslation(request.settings);
            Logger.success('BackgroundService', 'Translation manager re-initialized');

            sendResponse({ success: true });
          } catch (error) {
            Logger.error('BackgroundService', 'Failed to update config', error);
            sendResponse({ success: false, error: error.message });
          } finally {
            Logger.groupEnd();
          }
          break;
        }

        case 'getAvailableProviders': {
          const providers = this.apiManager.getAvailableProviders();
          Logger.log('BackgroundService', `Returning ${providers.length} providers`);
          sendResponse({ success: true, data: providers });
          break;
        }

        case 'validateProvider': {
          const validation = await this.apiManager.validateProvider(
            request.providerId,
            request.config
          );
          sendResponse({ success: true, data: validation });
          break;
        }

        case 'getQuota': {
          await this.ensureReady();
          const quota = await this.apiManager.getQuota(request.providerId);
          sendResponse({ success: true, data: quota });
          break;
        }

        case 'getTranslationStats': {
          await this.ensureReady();
          const stats = this.apiManager.getStats();
          const cacheStats = this.apiManager.getCacheStats();
          sendResponse({
            success: true,
            data: {
              ...stats,
              cache: cacheStats,
            },
          });
          break;
        }

        case 'clearCache': {
          await this.ensureReady();
          this.apiManager.clearCache();
          Logger.success('BackgroundService', 'Cache cleared');
          sendResponse({ success: true });
          break;
        }

        case 'clearStats': {
          await this.ensureReady();
          // TODO: 实现统计清除
          Logger.success('BackgroundService', 'Stats cleared');
          sendResponse({ success: true });
          break;
        }

        case 'parallelTranslate': {
          await this.ensureReady();
          const parallelResults = await this.apiManager.parallelTranslate(
            request.text,
            request.sourceLang,
            request.targetLang,
            request.providerIds
          );

          const resultsObj = {};
          for (const [providerId, result] of parallelResults.entries()) {
            resultsObj[providerId] = result;
          }
          sendResponse({ success: true, data: resultsObj });
          break;
        }

        default: {
          Logger.warn('BackgroundService', `Unknown action: ${action}`);
          sendResponse({ success: false, error: 'Unknown action' });
        }
      }
    } catch (error) {
      Logger.error('BackgroundService', `Error handling ${action}`, error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 处理存储变化
   */
  async handleStorageChange(changes, namespace) {
    Logger.log('BackgroundService', `Storage changed in ${namespace}`);
    
    if (namespace === 'sync') {
      // 存储变化时重新加载设置
      try {
        this.initialized = false;
        const settings = await this.storageManager.getSettings();
        const validation = ConfigManager.validate(settings);
        
        if (validation.valid) {
          Logger.log('BackgroundService', 'Reinitializing due to storage change');
          await this.initializeTranslation(settings);
        } else {
          this.initialized = false;
        }
      } catch (error) {
        Logger.error('BackgroundService', 'Failed to handle storage change', error);
      }
    }
  }

  /**
   * 处理扩展安装/更新
   */
  async handleInstall(details) {
    Logger.log('BackgroundService', `Extension installed: ${details.reason}`);

    if (details.reason === 'install') {
      // 首次安装，初始化默认设置
      const defaults = ConfigManager.getDefaults();
      await this.storageManager.saveSettings(defaults);
      Logger.success('BackgroundService', 'Default settings initialized');

      // 打开配置页面
      chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      // 更新时迁移配置
      const settings = await this.storageManager.getSettings();
      const migrated = ConfigManager.migrate(settings);
      await this.storageManager.saveSettings(migrated);
      Logger.success('BackgroundService', 'Settings migrated');
    }
  }
}

// 启动后台服务
new BackgroundService();
