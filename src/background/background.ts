import { APIManager } from './api-manager';
import { StorageManager } from '../shared/storage';
import { ConfigManager, TranslationSettings } from '../shared/config-manager';
import { Logger } from '../shared/logger';
import { AdapterFactory } from '../translation/core/AdapterFactory';
import type { AdapterConfig, TranslationResponse } from '../translation/interfaces/types';

interface BackgroundMessage {
  action: string;
  [key: string]: unknown;
}

class BackgroundService {
  private readonly apiManager = new APIManager();

  private readonly storageManager = new StorageManager();

  private initialized = false;

  private readyPromise: Promise<void> | null = null;

  constructor() {
    Logger.log('BackgroundService', 'Initializing AdapterFactory...');
    AdapterFactory.initialize();

    this.registerMessageHandlers();
    this.registerStorageHandlers();
    this.registerInstallHandlers();
    this.registerActionHandlers();

    this.readyPromise = this.init();
  }

  private async init(): Promise<void> {
    Logger.log('BackgroundService', 'Starting initialization...');

    if (typeof chrome === 'undefined') {
      Logger.error('BackgroundService', 'Chrome API not available');
      return;
    }

    try {
      let settings = await this.storageManager.getSettings();
      Logger.log('BackgroundService', 'Loaded settings from storage', {
        hasProviders: !!settings.providers,
        providersCount: Object.keys(settings.providers || {}).length
      });

      settings = ConfigManager.migrate(settings);

      const validation = ConfigManager.validate(settings);
      if (validation.valid) {
        Logger.success('BackgroundService', 'Configuration valid');
        ConfigManager.logConfig(settings);
        await this.initializeTranslation(settings);
      } else {
        Logger.warn('BackgroundService', 'Invalid configuration', validation.message);
        this.initialized = false;
      }
    } catch (error) {
      Logger.error('BackgroundService', 'Failed to initialize translation manager', error);
      this.initialized = false;
      throw error;
    }

    Logger.success('BackgroundService', 'Background service initialized');
  }

  private async ensureReady(): Promise<void> {
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

  private async initializeTranslation(settings: TranslationSettings): Promise<void> {
    this.initialized = false;
    const promise = this.apiManager.initialize(settings);
    this.readyPromise = promise;
    await promise;
    this.initialized = true;
  }

  private registerMessageHandlers(): void {
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((request: BackgroundMessage, sender, sendResponse) => {
        void this.handleMessage(request, sender, sendResponse);
        return true;
      });
      Logger.log('BackgroundService', 'Message handlers registered');
    }
  }

  private registerStorageHandlers(): void {
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        void this.handleStorageChange(changes, namespace);
      });
      Logger.log('BackgroundService', 'Storage handlers registered');
    }
  }

  private registerInstallHandlers(): void {
    if (chrome.runtime?.onInstalled) {
      chrome.runtime.onInstalled.addListener((details) => {
        void this.handleInstall(details);
      });
      Logger.log('BackgroundService', 'Install handlers registered');
    }
  }

  private registerActionHandlers(): void {
    if (chrome.action?.onClicked) {
      chrome.action.onClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
      });
      Logger.log('BackgroundService', 'Action handlers registered');
    }
  }

  private async handleMessage(
    request: BackgroundMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): Promise<void> {
    const action = request.action;
    Logger.log('BackgroundService', `Received message: ${action}`);

    try {
      switch (action) {
        case 'translate': {
          await this.ensureReady();
          const result = await this.apiManager.translate(
            String(request.text || ''),
            String(request.sourceLang || 'auto'),
            String(request.targetLang || 'zh-CN')
          );
          sendResponse({ success: true, data: result });
          break;
        }

        case 'detectLanguage': {
          const detectedLang = await this.apiManager.detectLanguage(String(request.text || ''));
          sendResponse({ success: true, data: detectedLang });
          break;
        }

        case 'getSettings': {
          const settings = await this.storageManager.getSettings();
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'saveSettings': {
          const saved = await this.storageManager.saveSettings(request.settings as TranslationSettings);
          sendResponse({ success: saved });
          break;
        }

        case 'updateTranslationConfig': {
          Logger.group('BackgroundService', 'Updating translation config');
          try {
            const validation = ConfigManager.validate(request.settings as TranslationSettings);
            if (!validation.valid) {
              Logger.error('BackgroundService', 'Invalid configuration', validation.message);
              sendResponse({ success: false, error: validation.message });
              break;
            }

            await this.storageManager.saveSettings(request.settings as TranslationSettings);
            Logger.success('BackgroundService', 'Settings saved to storage');

            await this.initializeTranslation(request.settings as TranslationSettings);
            Logger.success('BackgroundService', 'Translation manager re-initialized');

            sendResponse({ success: true });
          } catch (error) {
            Logger.error('BackgroundService', 'Failed to update config', error);
            sendResponse({ success: false, error: (error as Error).message });
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
            String(request.providerId),
            request.config as AdapterConfig
          );
          sendResponse({ success: true, data: validation });
          break;
        }

        case 'getQuota': {
          await this.ensureReady();
          const quota = await this.apiManager.getQuota(String(request.providerId));
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
              cache: cacheStats
            }
          });
          break;
        }

        case 'clearCache': {
          await this.ensureReady();
          this.apiManager.clearCache();
          sendResponse({ success: true });
          break;
        }

        case 'clearStats': {
          await this.ensureReady();
          this.apiManager.clearStats();
          sendResponse({ success: true });
          break;
        }

        case 'parallelTranslate': {
          await this.ensureReady();
          const parallelResults = await this.apiManager.parallelTranslate(
            String(request.text || ''),
            String(request.sourceLang || 'auto'),
            String(request.targetLang || 'zh-CN'),
            Array.isArray(request.providerIds) ? (request.providerIds as string[]) : []
          );
          const resultsObj: Record<string, TranslationResponse> = {};
          for (const [providerId, result] of parallelResults.entries()) {
            resultsObj[providerId] = result;
          }
          sendResponse({ success: true, data: resultsObj });
          break;
        }

        case 'synthesizeSpeech': {
          await this.ensureReady();
          try {
            const result = await this.apiManager.synthesizeSpeech(
              String(request.text || ''),
              request.options as Partial<import('../tts/interfaces').TTSSynthesisRequest> || {}
            );
            sendResponse({ success: true, data: result });
          } catch (error) {
            Logger.error('BackgroundService', 'Speech synthesis failed', error);
            sendResponse({ success: false, error: (error as Error).message });
          }
          break;
        }

        case 'isTTSEnabled': {
          const enabled = this.apiManager.isTTSEnabled();
          sendResponse({ success: true, data: enabled });
          break;
        }

        case 'getSpeechSettings': {
          const settings = this.apiManager.getSpeechSettings();
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'getTTSStats': {
          await this.ensureReady();
          try {
            const statsManager = (this.apiManager as any).translationManager?.statsManager;
            if (statsManager && typeof statsManager.getTTSStats === 'function') {
              const ttsStats = statsManager.getTTSStats();
              sendResponse({ success: true, data: ttsStats });
            } else {
              sendResponse({ success: true, data: null });
            }
          } catch (error) {
            Logger.error('BackgroundService', 'Failed to get TTS stats', error);
            sendResponse({ success: false, error: (error as Error).message });
          }
          break;
        }

        default: {
          Logger.warn('BackgroundService', `Unknown action: ${action}`);
          sendResponse({ success: false, error: 'Unknown action' });
        }
      }
    } catch (error) {
      Logger.error('BackgroundService', `Error handling ${action}`, error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async handleStorageChange(changes: Record<string, chrome.storage.StorageChange>, namespace: string): Promise<void> {
    Logger.log('BackgroundService', `Storage changed in ${namespace}`);

    if (namespace === 'sync') {
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

  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    Logger.log('BackgroundService', `Extension installed: ${details.reason}`);

    if (details.reason === 'install') {
      const defaults = ConfigManager.getDefaults();
      await this.storageManager.saveSettings(defaults);
      Logger.success('BackgroundService', 'Default settings initialized');
      chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      const settings = await this.storageManager.getSettings();
      const migrated = ConfigManager.migrate(settings);
      await this.storageManager.saveSettings(migrated);
      Logger.success('BackgroundService', 'Settings migrated');
    }
  }
}

new BackgroundService();
