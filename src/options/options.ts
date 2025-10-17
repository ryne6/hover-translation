/* eslint-disable @typescript-eslint/ban-ts-comment */
import { sendRuntimeMessage } from '../shared/utils';
import { StorageManager } from '../shared/storage';
import { ConfigManager } from '../shared/config-manager';
import { AutoSaveManager } from './auto-save-manager';
import type { TranslationSettings, ProviderInstanceConfig, ProviderConfigMap } from '../shared/config-manager';
import type { ProviderInfo, ProviderStatsSnapshot, StatsSnapshot } from '../translation/interfaces/types';
import type { SupportedLanguageCode } from '../shared/constants';

type ProviderSummary = {
  id: string;
  displayName: string;
  category: string;
  documentation?: string;
  [key: string]: unknown;
};

type CacheStats = {
  size: number;
  usage: string;
};

type OptionsStats = StatsSnapshot & {
  cache?: CacheStats;
};

interface ProviderValidationResponse {
  success: boolean;
  data?: {
    valid: boolean;
    message?: string;
  };
}

interface ProvidersResponse {
  success: boolean;
  data?: ProviderSummary[];
}

interface StatsResponse {
  success: boolean;
  data?: OptionsStats;
}

interface QuotaResponse {
  success: boolean;
  data?: {
    used: number;
    limit: number;
  };
}

interface UpdateConfigResponse {
  success: boolean;
  error?: string;
}

/**
 * 弹窗管理器（新版）
 * 支持多翻译引擎配置
 */
class PopupManager {
  private providers: ProviderSummary[];

  private settings: TranslationSettings;

  private stats: OptionsStats | null;

  private readonly storageManager: StorageManager;

  private readonly autoSaveManager: AutoSaveManager;

  constructor() {
    this.providers = [];
    this.storageManager = new StorageManager();
    this.settings = ConfigManager.getDefaults();
    this.stats = null;

    // 初始化自动保存管理器
    this.autoSaveManager = new AutoSaveManager({
      autoSaveEnabled: true,
      showSuggestions: true,
      showFloatingButton: true,
      onSave: async (settings) => {
        return await this.storageManager.saveSettings(settings);
      },
      onConfigChange: (settings) => {
        this.settings = settings;
      }
    });

    void this.init();
  }

  /**
   * 初始化
   */
  private async init(): Promise<void> {
    try {
      // 从后台服务获取所有可用的提供商
      await this.loadProviders();
      console.log('Available providers:', this.providers);

      // 加载用户设置
      await this.loadSettings();

      // 设置自动保存管理器的配置
      this.autoSaveManager.setSettings(this.settings);
      
      // 加载已忽略的建议
      this.autoSaveManager.loadDismissedSuggestions();

      // 检查是否首次使用
      this.checkFirstTimeUser();

      // 初始化 UI
      this.initializeUI();

      // 绑定事件
      this.bindEvents();

      // 加载统计信息
      await this.loadStats();

      console.log('Popup initialized');
    } catch (error) {
      console.error('初始化失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.showError('初始化失败: ' + message);
    }
  }

  /**
   * 加载提供商列表
   */
  private async loadProviders(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await sendRuntimeMessage<{ action: 'getAvailableProviders' }, ProvidersResponse>({
          action: 'getAvailableProviders'
        });

        if (response?.success && Array.isArray(response.data)) {
          this.providers = response.data;
        } else {
          this.providers = this.getDefaultProviders();
        }
      } else {
        this.providers = this.getDefaultProviders();
      }
    } catch (error) {
      console.error('加载提供商列表失败:', error);
      this.providers = this.getDefaultProviders();
    }
  }

  /**
   * 获取默认提供商列表（备用）
   */
  private getDefaultProviders(): ProviderSummary[] {
    return [
      { id: 'google', displayName: 'Google 翻译', category: 'traditional' },
      { id: 'deepl', displayName: 'DeepL', category: 'traditional' },
      { id: 'baidu', displayName: '百度翻译', category: 'traditional' },
      { id: 'microsoft', displayName: 'Microsoft 翻译', category: 'traditional' },
      { id: 'youdao', displayName: '有道翻译', category: 'traditional' },
      { id: 'tencent', displayName: '腾讯翻译', category: 'traditional' },
      { id: 'openai', displayName: 'OpenAI GPT', category: 'ai' },
      { id: 'claude', displayName: 'Claude AI', category: 'ai' },
      { id: 'gemini', displayName: 'Gemini AI', category: 'ai' },
    ];
  }

  /**
   * 加载设置
   */
  private async loadSettings(): Promise<void> {
    this.settings = await this.storageManager.getSettings();
  }

  /**
   * 保存设置
   */
  private async saveSettings(): Promise<void> {
    try {
      const saved = await this.storageManager.saveSettings(this.settings);
      if (saved) {
        this.showSuccess('设置已保存');
      } else {
        this.showError('保存失败: Chrome Storage 不可用');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.showError('保存失败: ' + message);
    }
  }

  /**
   * 初始化 UI
   */
  private initializeUI(): void {
    // 初始化页面导航
    this.initializeNavigation();

    // 初始化标签页（如果存在）
    if (document.querySelectorAll('.tab').length > 0) {
      this.initializeTabs();
    }

    // 初始化提供商卡片
    this.initializeProviderCards();

    // 初始化主要服务下拉框
    this.updatePrimaryProviderSelect();

    // 初始化备用服务列表
    this.updateFallbackList();

    // 加载保存的设置到 UI
    this.loadSettingsToUI();
  }

  /**
   * 初始化页面导航（Options 页面）
   */
  private initializeNavigation(): void {
    const navItems = document.querySelectorAll<HTMLElement>('.nav-item');
    const pages = document.querySelectorAll<HTMLElement>('.page');

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        // 移除所有激活状态
        navItems.forEach((nav) => nav.classList.remove('active'));
        pages.forEach((page) => page.classList.remove('active'));

        // 激活当前页面
        item.classList.add('active');
        const pageId = 'page-' + item.dataset.page;
        document.getElementById(pageId)?.classList.add('active');
      });
    });
  }

  /**
   * 初始化标签页（Popup 页面）
   */
  private initializeTabs(): void {
    const tabs = document.querySelectorAll<HTMLElement>('.tab');
    const panels = document.querySelectorAll<HTMLElement>('.tab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        // 移除所有激活状态
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));

        // 激活当前标签
        tab.classList.add('active');
        const panelId = 'panel-' + tab.dataset.tab;
        document.getElementById(panelId)?.classList.add('active');
      });
    });
  }

  /**
   * 初始化提供商卡片
   */
  private initializeProviderCards(): void {
    const cards = document.querySelectorAll<HTMLElement>('.provider-card');

    cards.forEach((card) => {
      const header = card.querySelector<HTMLElement>('.provider-header');
      const config = card.querySelector<HTMLElement>('.provider-config');

      header?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.classList.contains('provider-toggle') || target?.classList.contains('slider')) {
          return;
        }

        config?.classList.toggle('collapsed');
      });

      const toggle = card.querySelector<HTMLInputElement>('.provider-toggle');
      toggle?.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const providerId = target.dataset.provider ?? '';
        this.handleProviderToggle(providerId, target.checked);
      });

      const validateBtn = card.querySelector<HTMLButtonElement>('.btn-validate');
      validateBtn?.addEventListener('click', () => {
        const providerId = validateBtn.dataset.provider ?? '';
        this.validateProvider(providerId);
      });

      const quotaBtn = card.querySelector<HTMLButtonElement>('.btn-quota');
      quotaBtn?.addEventListener('click', () => {
        const providerId = quotaBtn.dataset.provider ?? '';
        this.checkQuota(providerId);
      });

      const docsBtn = card.querySelector<HTMLButtonElement>('.btn-docs');
      docsBtn?.addEventListener('click', () => {
        const providerId = docsBtn.dataset.provider ?? '';
        const provider = this.providers.find((p) => p.id === providerId);
        if (provider?.documentation) {
          window.open(provider.documentation, '_blank');
        }
      });

      const togglePasswordBtns = card.querySelectorAll<HTMLButtonElement>('.toggle-password');
      togglePasswordBtns.forEach((btn) => {
        btn.addEventListener('click', (event) => {
          const target = event.target as HTMLElement | null;
          const input = target?.previousElementSibling as HTMLInputElement | null;
          if (!input) {
            return;
          }
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
          } else {
            input.type = 'password';
            btn.textContent = '👁️';
          }
        });
      });
    });
  }

  /**
   * 更新主要服务下拉框
   */
  private updatePrimaryProviderSelect(): void {
    const select = document.getElementById('primaryProvider') as HTMLSelectElement | null;
    if (!select) {
      console.warn('primaryProvider select not found');
      return;
    }

    select.innerHTML = '<option value="">请先配置翻译服务</option>';

    // 获取已启用的提供商
    const enabledProviders = this.providers.filter(p => 
      this.settings.providers?.[p.id]?.enabled
    );

    console.log('Updating primaryProvider select:', {
      totalProviders: this.providers.length,
      enabledProviders: enabledProviders.length,
      providersConfig: this.settings.providers,
    });

    if (enabledProviders.length === 0) {
      console.warn('No enabled providers found');
      return;
    }

    enabledProviders.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = provider.displayName;
      if (this.settings.primaryProvider === provider.id) {
        option.selected = true;
      }
      select.appendChild(option);
      console.log(`Added option: ${provider.displayName} (${provider.id})`);
    });
  }

  /**
   * 更新备用服务列表
   */
  private updateFallbackList(): void {
    const list = document.getElementById('fallbackList');
    if (!list) return;

    const fallbackProviders = this.settings.fallbackProviders || [];
    
    if (fallbackProviders.length === 0) {
      list.innerHTML = '<p class="empty-state">未配置备用服务</p>';
      return;
    }

    list.innerHTML = '';
    fallbackProviders.forEach((providerId, index) => {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) return;

      const item = document.createElement('div');
      item.className = 'fallback-item';
      item.innerHTML = `
        <span class="fallback-order">${index + 1}</span>
        <span class="fallback-name">${provider.displayName}</span>
        <div class="fallback-actions">
          <button class="btn-icon btn-move-up" data-index="${index}">↑</button>
          <button class="btn-icon btn-move-down" data-index="${index}">↓</button>
          <button class="btn-icon btn-remove" data-index="${index}">×</button>
        </div>
      `;
      list.appendChild(item);
    });

    // 绑定按钮事件
    this.bindFallbackActions();
  }

  /**
   * 绑定备用服务操作
   */
  private bindFallbackActions(): void {
    const list = document.getElementById('fallbackList');
    if (!list) return;

    list.querySelectorAll<HTMLButtonElement>('.btn-move-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        this.moveFallbackProvider(index, -1);
      });
    });

    list.querySelectorAll<HTMLButtonElement>('.btn-move-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        this.moveFallbackProvider(index, 1);
      });
    });

    list.querySelectorAll<HTMLButtonElement>('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        this.removeFallbackProvider(index);
      });
    });
  }

  /**
   * 移动备用服务位置
   */
  private moveFallbackProvider(index: number, direction: number): void {
    const fallbacks = this.settings.fallbackProviders || [];
    if (index < 0 || index >= fallbacks.length) {
      return;
    }
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= fallbacks.length) return;

    const temp = fallbacks[index];
    fallbacks[index] = fallbacks[newIndex];
    fallbacks[newIndex] = temp;

    this.settings.fallbackProviders = [...fallbacks];
    this.updateFallbackList();
  }

  /**
   * 移除备用服务
   */
  private removeFallbackProvider(index: number): void {
    const fallbacks = this.settings.fallbackProviders || [];
    if (index < 0 || index >= fallbacks.length) {
      return;
    }
    fallbacks.splice(index, 1);
    this.settings.fallbackProviders = [...fallbacks];
    this.updateFallbackList();
  }

  /**
   * 处理提供商开关切换
   */
  private handleProviderToggle(providerId: string, enabled: boolean): void {
    if (!this.settings.providers) {
      this.settings.providers = {};
    }
    const providerConfig: ProviderInstanceConfig = this.settings.providers[providerId] ?? { enabled: false };
    providerConfig.enabled = enabled;
    this.settings.providers[providerId] = providerConfig;

    // 如果禁用了主要服务，需要切换
    if (!enabled && this.settings.primaryProvider === providerId) {
      const enabledProviders = Object.entries(this.settings.providers)
        .filter(([_id, config]) => config.enabled)
        .map(([provider]) => provider);
      
      this.settings.primaryProvider = enabledProviders[0] || '';
    }

    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
  }

  /**
   * 验证提供商配置
   */
  private async validateProvider(providerId: string): Promise<void> {
    const statusEl = document.querySelector<HTMLElement>(`.validation-status[data-provider="${providerId}"]`);
    if (!statusEl) return;

    statusEl.textContent = '验证中...';
    statusEl.className = 'validation-status validating';

    try {
      // 收集配置
      const config = this.collectProviderConfig(providerId);

      // 调用后台服务验证
      const response = await sendRuntimeMessage<
        { action: 'validateProvider'; providerId: string; config: ProviderInstanceConfig },
        ProviderValidationResponse
      >({
        action: 'validateProvider',
        providerId,
        config
      });

      if (response?.success && response.data?.valid) {
        statusEl.textContent = '✓ 验证成功';
        statusEl.className = 'validation-status success';

        // 验证成功后自动启用服务
        const toggle = document.querySelector<HTMLInputElement>(`.provider-toggle[data-provider="${providerId}"]`);
        if (toggle && !toggle.checked) {
          toggle.checked = true;
          this.handleProviderToggle(providerId, true);
        }

        // 使用自动保存管理器处理验证成功后的逻辑
        await this.autoSaveManager.onValidationSuccess(providerId, config);
      } else {
        statusEl.textContent = '✗ 验证失败: ' + (response?.data?.message || '未知错误');
        statusEl.className = 'validation-status error';
      }
    } catch (error) {
      console.error('验证失败:', error);
      statusEl.textContent = '✗ 验证出错';
      statusEl.className = 'validation-status error';
    }
  }

  /**
   * 检查配额
   */
  private async checkQuota(providerId: string): Promise<void> {
    try {
      const response = await sendRuntimeMessage<
        { action: 'getQuota'; providerId: string },
        QuotaResponse
      >({
        action: 'getQuota',
        providerId
      });

      if (response?.success && response.data) {
        const quota = response.data;
        const percent = quota.limit > 0 ? ((quota.used / quota.limit) * 100).toFixed(1) : '0';
        alert(`配额使用情况:\n已使用: ${quota.used}\n总限额: ${quota.limit}\n使用率: ${percent}%`);
      } else {
        alert('该服务不支持配额查询');
      }
    } catch (error) {
      console.error('查询配额失败:', error);
      alert('查询配额失败');
    }
  }

  /**
   * 收集提供商配置
   */
  private collectProviderConfig(providerId: string): ProviderInstanceConfig {
    const card = document.querySelector<HTMLElement>(`.provider-card[data-provider="${providerId}"]`);
    const existing = this.settings.providers?.[providerId] ?? { enabled: false };
    const config: ProviderInstanceConfig = { ...existing };

    if (!card) {
      return config;
    }

    const inputs = card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-field]');
    inputs.forEach((input) => {
      const field = input.dataset.field;
      if (!field) {
        return;
      }
      config[field] = (input.value ?? '').trim();
    });

    if (providerId === 'youdao' || providerId === 'baidu') {
      config.apiKey = (config.appId as string) || '';
      config.apiSecret = (config.secret as string) || '';
    } else if (providerId === 'tencent') {
      config.apiKey = (config.secretId as string) || '';
      config.apiSecret = (config.secretKey as string) || '';
    } else if (providerId === 'microsoft') {
      const apiKeyInput = card.querySelector<HTMLInputElement>('.api-key');
      if (apiKeyInput) {
        config.apiKey = apiKeyInput.value.trim();
      }
      const regionInput = card.querySelector<HTMLInputElement>('.region');
      if (regionInput) {
        config.region = regionInput.value.trim();
      }
    } else {
      const apiKeyInput = card.querySelector<HTMLInputElement>('.api-key');
      if (apiKeyInput) {
        config.apiKey = apiKeyInput.value.trim();
      }
    }

    return config;
  }

  /**
   * 加载设置到 UI
   */
  private loadSettingsToUI(): void {
    const targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement | null;
    if (targetLanguageSelect) {
      targetLanguageSelect.value = this.settings.targetLanguage ?? 'zh-CN';
    }

    const sourceLanguageSelect = document.getElementById('sourceLanguage') as HTMLSelectElement | null;
    if (sourceLanguageSelect) {
      sourceLanguageSelect.value = this.settings.sourceLanguage ?? 'auto';
    }

    const enableCacheCheckbox = document.getElementById('enableCache') as HTMLInputElement | null;
    if (enableCacheCheckbox) {
      enableCacheCheckbox.checked = this.settings.enableCache !== false;
    }

    const autoDetectCheckbox = document.getElementById('autoDetect') as HTMLInputElement | null;
    if (autoDetectCheckbox) {
      autoDetectCheckbox.checked = this.settings.autoDetect !== false;
    }

    const showOriginalCheckbox = document.getElementById('showOriginal') as HTMLInputElement | null;
    if (showOriginalCheckbox) {
      showOriginalCheckbox.checked = this.settings.showOriginal !== false;
    }

    const formalityInputs = document.querySelectorAll<HTMLInputElement>('input[name="formality"]');
    const selectedFormality = this.settings.formality ?? 'default';
    formalityInputs.forEach((input) => {
      input.checked = input.value === selectedFormality;
    });

    const domainSelect = document.getElementById('domain') as HTMLSelectElement | null;
    if (domainSelect) {
      domainSelect.value = this.settings.domain ?? 'general';
    }

    const timeoutInput = document.getElementById('timeout') as HTMLInputElement | null;
    if (timeoutInput) {
      const timeoutSeconds = Math.round((this.settings.timeout ?? 30000) / 1000);
      timeoutInput.value = String(timeoutSeconds);
    }

    const retryInput = document.getElementById('retryCount') as HTMLInputElement | null;
    if (retryInput) {
      retryInput.value = String(this.settings.retryCount ?? 3);
    }

    const parallelCheckbox = document.getElementById('parallelTranslation') as HTMLInputElement | null;
    if (parallelCheckbox) {
      parallelCheckbox.checked = this.settings.parallelTranslation ?? false;
    }

    const autoFallbackCheckbox = document.getElementById('autoFallback') as HTMLInputElement | null;
    if (autoFallbackCheckbox) {
      autoFallbackCheckbox.checked = this.settings.autoFallback !== false;
    }

    // 加载语音合成设置
    const speechEnabledInput = document.getElementById('speechEnabled') as HTMLInputElement | null;
    const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
    const ttsVoiceNameSelect = document.getElementById('ttsVoiceName') as HTMLSelectElement | null;
    const ttsSpeedInput = document.getElementById('ttsSpeed') as HTMLInputElement | null;
    const ttsVolumeInput = document.getElementById('ttsVolume') as HTMLInputElement | null;
    const ttsFormatSelect = document.getElementById('ttsFormat') as HTMLSelectElement | null;

    if (speechEnabledInput && speechProviderSelect) {
      const speechSettings = this.settings.speech || ConfigManager.getDefaults().speech!;
      speechEnabledInput.checked = speechSettings.enabled;
      speechProviderSelect.value = speechSettings.provider;
      
      if (ttsVoiceNameSelect) ttsVoiceNameSelect.value = speechSettings.voiceName;
      if (ttsSpeedInput) ttsSpeedInput.value = speechSettings.speed;
      if (ttsVolumeInput) ttsVolumeInput.value = speechSettings.volume;
      if (ttsFormatSelect) ttsFormatSelect.value = speechSettings.format;

      // 更新有道 TTS 配置显示状态
      this.updateYoudaoTTSConfigVisibility();
      this.updateTTSStatus();
    }

    // 加载自动保存偏好设置
    const autoSavePrefs = this.settings.autoSavePreferences || ConfigManager.getDefaults().autoSavePreferences!;
    const autoSaveEnabledInput = document.getElementById('autoSaveEnabled') as HTMLInputElement | null;
    const showSuggestionsInput = document.getElementById('showSuggestions') as HTMLInputElement | null;
    const showFloatingButtonInput = document.getElementById('showFloatingButton') as HTMLInputElement | null;

    if (autoSaveEnabledInput) {
      autoSaveEnabledInput.checked = autoSavePrefs.autoSaveEnabled;
    }
    if (showSuggestionsInput) {
      showSuggestionsInput.checked = autoSavePrefs.showSuggestions;
    }
    if (showFloatingButtonInput) {
      showFloatingButtonInput.checked = autoSavePrefs.showFloatingButton;
    }

    Object.entries(this.settings.providers ?? {}).forEach(([providerId, config]) => {
      const card = document.querySelector<HTMLElement>(`.provider-card[data-provider="${providerId}"]`);
      if (!card) {
        return;
      }

      const toggle = card.querySelector<HTMLInputElement>('.provider-toggle');
      if (toggle) {
        toggle.checked = config.enabled ?? false;
      }

      const inputs = card.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-field]');
      inputs.forEach((input) => {
        const field = input.dataset.field;
        if (!field) {
          return;
        }
        const value = config[field];
        if (typeof value === 'string') {
          input.value = value;
        }
      });

      const apiKeyInput = card.querySelector<HTMLInputElement>('.api-key');
      if (apiKeyInput) {
        let value: string | undefined = config.apiKey as string | undefined;
        if (providerId === 'youdao' || providerId === 'baidu') {
          value = (config.secret as string | undefined) ?? (config.apiSecret as string | undefined) ?? '';
        } else if (providerId === 'tencent') {
          value = (config.secretKey as string | undefined) ?? (config.apiSecret as string | undefined) ?? '';
        }

        if (typeof value === 'string') {
          apiKeyInput.value = value;
        }
      }
    });

    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
  }

  /**
   * 从 UI 收集设置
   */
  collectSettings(): TranslationSettings {
    const settings: TranslationSettings = {
      ...ConfigManager.getDefaults(),
      ...this.settings,
      providers: { ...this.settings.providers }
    };

    const targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement | null;
    if (targetLanguageSelect) {
      settings.targetLanguage = targetLanguageSelect.value as SupportedLanguageCode;
    }

    const sourceLanguageSelect = document.getElementById('sourceLanguage') as HTMLSelectElement | null;
    if (sourceLanguageSelect) {
      const value = sourceLanguageSelect.value as SupportedLanguageCode | 'auto';
      settings.sourceLanguage = value || 'auto';
    }

    const enableCacheInput = document.getElementById('enableCache') as HTMLInputElement | null;
    if (enableCacheInput) {
      settings.enableCache = enableCacheInput.checked;
    }

    const autoDetectInput = document.getElementById('autoDetect') as HTMLInputElement | null;
    if (autoDetectInput) {
      settings.autoDetect = autoDetectInput.checked;
    }

    const showOriginalInput = document.getElementById('showOriginal') as HTMLInputElement | null;
    if (showOriginalInput) {
      settings.showOriginal = showOriginalInput.checked;
    }

    const formalityRadio = document.querySelector<HTMLInputElement>('input[name="formality"]:checked');
    if (formalityRadio) {
      settings.formality = formalityRadio.value;
    }

    const domainSelect = document.getElementById('domain') as HTMLSelectElement | null;
    if (domainSelect) {
      settings.domain = domainSelect.value;
    }

    const timeoutInput = document.getElementById('timeout') as HTMLInputElement | null;
    if (timeoutInput) {
      const timeoutSeconds = Number.parseInt(timeoutInput.value, 10);
      if (!Number.isNaN(timeoutSeconds)) {
        settings.timeout = timeoutSeconds * 1000;
      }
    }

    const retryCountInput = document.getElementById('retryCount') as HTMLInputElement | null;
    if (retryCountInput) {
      const retryCount = Number.parseInt(retryCountInput.value, 10);
      if (!Number.isNaN(retryCount)) {
        settings.retryCount = retryCount;
      }
    }

    const parallelTranslationInput = document.getElementById('parallelTranslation') as HTMLInputElement | null;
    if (parallelTranslationInput) {
      settings.parallelTranslation = parallelTranslationInput.checked;
    }

    const autoFallbackInput = document.getElementById('autoFallback') as HTMLInputElement | null;
    if (autoFallbackInput) {
      settings.autoFallback = autoFallbackInput.checked;
    }

    const primaryProviderSelect = document.getElementById('primaryProvider') as HTMLSelectElement | null;
    if (primaryProviderSelect) {
      settings.primaryProvider = primaryProviderSelect.value;
    }

    // 语音合成设置
    const speechEnabledInput = document.getElementById('speechEnabled') as HTMLInputElement | null;
    const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
    const ttsVoiceNameSelect = document.getElementById('ttsVoiceName') as HTMLSelectElement | null;
    const ttsSpeedInput = document.getElementById('ttsSpeed') as HTMLInputElement | null;
    const ttsVolumeInput = document.getElementById('ttsVolume') as HTMLInputElement | null;
    const ttsFormatSelect = document.getElementById('ttsFormat') as HTMLSelectElement | null;

    if (speechEnabledInput && speechProviderSelect) {
      settings.speech = {
        enabled: speechEnabledInput.checked,
        provider: speechProviderSelect.value as 'browser' | 'youdao',
        voiceName: ttsVoiceNameSelect?.value || 'youxiaoqin',
        speed: ttsSpeedInput?.value || '1.0',
        volume: ttsVolumeInput?.value || '1.0',
        format: (ttsFormatSelect?.value as 'mp3' | 'wav') || 'mp3'
      };
    }

    // 自动保存偏好设置
    const autoSaveEnabledInput = document.getElementById('autoSaveEnabled') as HTMLInputElement | null;
    const showSuggestionsInput = document.getElementById('showSuggestions') as HTMLInputElement | null;
    const showFloatingButtonInput = document.getElementById('showFloatingButton') as HTMLInputElement | null;

    settings.autoSavePreferences = {
      autoSaveEnabled: autoSaveEnabledInput?.checked ?? true,
      showSuggestions: showSuggestionsInput?.checked ?? true,
      showFloatingButton: showFloatingButtonInput?.checked ?? true
    };

    settings.fallbackProviders = Array.isArray(this.settings.fallbackProviders)
      ? [...this.settings.fallbackProviders]
      : [];

    const providerConfigs: ProviderConfigMap = {};
    const cards = document.querySelectorAll<HTMLElement>('.provider-card');

    cards.forEach((card) => {
      const providerId = card.dataset.provider;
      if (!providerId) {
        return;
      }

      const toggle = card.querySelector<HTMLInputElement>('.provider-toggle');
      const providerConfig = this.collectProviderConfig(providerId);
      providerConfig.enabled = toggle?.checked ?? false;
      providerConfigs[providerId] = providerConfig;
    });

    settings.providers = providerConfigs;

    return settings;
  }

  /**
   * 加载统计信息
   */
  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTranslationStats' });
      
      if (response.success) {
        this.stats = response.data;
        this.updateStatsUI();
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }

  /**
   * 更新统计 UI
   */
  updateStatsUI() {
    if (!this.stats) return;

    // 总体统计
    const totalRequestsEl = document.getElementById('totalRequests');
    if (totalRequestsEl) {
      totalRequestsEl.textContent = String(this.stats.total.requests ?? 0);
    }

    const totalCharactersEl = document.getElementById('totalCharacters');
    if (totalCharactersEl) {
      totalCharactersEl.textContent = String(this.stats.total.characters ?? 0);
    }

    const totalCostEl = document.getElementById('totalCost');
    if (totalCostEl) {
      totalCostEl.textContent = '$' + (this.stats.total.cost || 0).toFixed(4);
    }
    
    const successRate = this.stats.total.requests > 0
      ? ((this.stats.total.successes / this.stats.total.requests) * 100).toFixed(1)
      : 0;
    const successRateEl = document.getElementById('successRate');
    if (successRateEl) {
      successRateEl.textContent = successRate + '%';
    }

    // 今日统计
    const todayRequestsEl = document.getElementById('todayRequests');
    if (todayRequestsEl) {
      todayRequestsEl.textContent = String(this.stats.today.requests ?? 0);
    }

    const todayCharactersEl = document.getElementById('todayCharacters');
    if (todayCharactersEl) {
      todayCharactersEl.textContent = String(this.stats.today.characters ?? 0);
    }

    const todayCostEl = document.getElementById('todayCost');
    if (todayCostEl) {
      todayCostEl.textContent = '$' + (this.stats.today.cost || 0).toFixed(4);
    }

    // 缓存统计
    const cacheStats = this.stats.cache;
    const cacheSizeEl = document.getElementById('cacheSize');
    if (cacheSizeEl) {
      cacheSizeEl.textContent = String(cacheStats?.size ?? 0);
    }

    const cacheUsageEl = document.getElementById('cacheUsage');
    if (cacheUsageEl) {
      cacheUsageEl.textContent = cacheStats?.usage ?? '0%';
    }

    // 各提供商统计
    this.updateProviderStats();
  }

  /**
   * 更新提供商统计
   */
  updateProviderStats() {
    const list = document.getElementById('providerStatsList');
    if (!list || !this.stats?.byProvider) return;

    const providerStats = Object.entries(this.stats.byProvider);
    
    if (providerStats.length === 0) {
      list.innerHTML = '<p class="empty-state">暂无统计数据</p>';
      return;
    }

    list.innerHTML = '';
    providerStats.forEach(([providerId, stats]) => {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) return;

      const item = document.createElement('div');
      item.className = 'provider-stat-item';
      item.innerHTML = `
        <div class="provider-stat-header">
          <span class="provider-stat-name">${provider.displayName}</span>
          <span class="provider-stat-rate">${stats.successRate}</span>
        </div>
        <div class="provider-stat-details">
          <span>请求: ${stats.requests}</span>
          <span>成功: ${stats.successes}</span>
          <span>失败: ${stats.failures}</span>
          <span>字符: ${stats.characters}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  /**
   * 更新有道 TTS 配置显示状态
   */
  private updateYoudaoTTSConfigVisibility(): void {
    const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
    const youdaoTTSConfig = document.getElementById('youdaoTTSConfig');
    
    if (speechProviderSelect && youdaoTTSConfig) {
      youdaoTTSConfig.style.display = speechProviderSelect.value === 'youdao' ? 'block' : 'none';
    }
  }

  /**
   * 更新 TTS 状态显示
   */
  private updateTTSStatus(): void {
    const statusEl = document.getElementById('ttsStatus');
    if (!statusEl) return;

    const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
    const youdaoConfig = this.settings.providers?.youdao;
    
    if (speechProviderSelect?.value === 'youdao') {
      if (youdaoConfig?.enabled && youdaoConfig?.apiKey && youdaoConfig?.apiSecret) {
        statusEl.innerHTML = '<span class="status-icon">✅</span><span class="status-text">有道 TTS 已配置</span>';
      } else {
        statusEl.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">需要配置有道翻译 API</span>';
      }
    } else {
      statusEl.innerHTML = '<span class="status-icon">ℹ️</span><span class="status-text">使用浏览器原生语音</span>';
    }
  }

  /**
   * 测试语音合成
   */
  private async testSpeechSynthesis(): Promise<void> {
    const testTextInput = document.getElementById('testText') as HTMLInputElement | null;
    const testBtn = document.getElementById('testSpeech') as HTMLButtonElement | null;
    
    if (!testTextInput || !testBtn) return;

    const text = testTextInput.value.trim();
    if (!text) {
      this.showError('请输入要测试的文本');
      return;
    }

    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = '⏳ 合成中...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'synthesizeSpeech',
        text: text,
        options: {
          voiceName: (document.getElementById('ttsVoiceName') as HTMLSelectElement)?.value,
          speed: (document.getElementById('ttsSpeed') as HTMLInputElement)?.value,
          volume: (document.getElementById('ttsVolume') as HTMLInputElement)?.value,
          format: (document.getElementById('ttsFormat') as HTMLSelectElement)?.value
        }
      });

      if (response?.success) {
        // 播放音频
        const audio = new Audio();
        audio.src = `data:audio/${response.data.format};base64,${response.data.audioData}`;
        await audio.play();
        this.showSuccess('语音播放成功');
      } else {
        this.showError('语音合成失败: ' + (response?.error || '未知错误'));
      }
    } catch (error) {
      console.error('语音测试失败:', error);
      this.showError('语音测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = originalText;
    }
  }

  /**
   * 绑定事件
   */
  bindEvents(): void {
    const saveBtn = document.getElementById('saveSettings') as HTMLButtonElement | null;
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const originalText = saveBtn.textContent ?? '保存设置';
        const restoreLater = () => {
          setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
          }, 2000);
        };

        try {
          saveBtn.disabled = true;
          saveBtn.textContent = '⏳ 保存中...';

          this.settings = this.collectSettings();

          const enabledProviders = Object.entries(this.settings.providers || {}).filter(([_id, config]) => config.enabled);
          if (enabledProviders.length === 0) {
            this.showError('请至少启用一个翻译服务！');
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            return;
          }

          if (!this.settings.primaryProvider) {
            this.settings.primaryProvider = enabledProviders[0][0];
            const primarySelect = document.getElementById('primaryProvider') as HTMLSelectElement | null;
            if (primarySelect) {
              primarySelect.value = this.settings.primaryProvider;
            }
          }

          const response = await chrome.runtime.sendMessage({
            action: 'updateTranslationConfig',
            settings: this.settings
          });

          if (response?.success) {
            saveBtn.textContent = '✅ 已保存';
            this.showSuccess('设置已保存并应用！现在可以使用翻译功能了 🎉');
          } else {
            saveBtn.textContent = '❌ 保存失败';
            this.showError('保存失败: ' + (response?.error || '未知错误'));
          }

          restoreLater();
        } catch (error) {
          console.error('保存设置失败:', error);
          saveBtn.textContent = '❌ 保存失败';
          const message = error instanceof Error ? error.message : String(error);
          this.showError('保存失败: ' + message);
          restoreLater();
        }
      });
    }

    const resetBtn = document.getElementById('resetSettings') as HTMLButtonElement | null;
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('确定要重置所有设置吗？')) {
          this.settings = ConfigManager.getDefaults();
          this.loadSettingsToUI();
        }
      });
    }

    const primarySelect = document.getElementById('primaryProvider') as HTMLSelectElement | null;
    if (primarySelect) {
      primarySelect.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        this.settings.primaryProvider = target.value;
      });
    }

    const clearCacheBtn = document.getElementById('clearCache') as HTMLButtonElement | null;
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'clearCache' });
        this.showSuccess('缓存已清空');
        await this.loadStats();
      });
    }

    const clearStatsBtn = document.getElementById('clearStats') as HTMLButtonElement | null;
    if (clearStatsBtn) {
      clearStatsBtn.addEventListener('click', async () => {
        if (confirm('确定要清空所有统计数据吗？')) {
          await chrome.runtime.sendMessage({ action: 'clearStats' });
          this.showSuccess('统计已清空');
          await this.loadStats();
        }
      });
    }

    const exportBtn = document.getElementById('exportStats') as HTMLButtonElement | null;
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = JSON.stringify(this.stats, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `translation-stats-${new Date().toISOString()}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
    }

    // 语音合成相关事件
    const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
    if (speechProviderSelect) {
      speechProviderSelect.addEventListener('change', () => {
        this.updateYoudaoTTSConfigVisibility();
        this.updateTTSStatus();
      });
    }

    const ttsSpeedInput = document.getElementById('ttsSpeed') as HTMLInputElement | null;
    if (ttsSpeedInput) {
      ttsSpeedInput.addEventListener('input', () => {
        const valueEl = document.getElementById('ttsSpeedValue');
        if (valueEl) {
          valueEl.textContent = ttsSpeedInput.value;
        }
      });
    }

    const ttsVolumeInput = document.getElementById('ttsVolume') as HTMLInputElement | null;
    if (ttsVolumeInput) {
      ttsVolumeInput.addEventListener('input', () => {
        const valueEl = document.getElementById('ttsVolumeValue');
        if (valueEl) {
          valueEl.textContent = ttsVolumeInput.value;
        }
      });
    }

    const testSpeechBtn = document.getElementById('testSpeech') as HTMLButtonElement | null;
    if (testSpeechBtn) {
      testSpeechBtn.addEventListener('click', () => {
        void this.testSpeechSynthesis();
      });
    }

    // 自动保存偏好设置事件
    const autoSaveEnabledInput = document.getElementById('autoSaveEnabled') as HTMLInputElement | null;
    if (autoSaveEnabledInput) {
      autoSaveEnabledInput.addEventListener('change', () => {
        if (autoSaveEnabledInput.checked) {
          this.autoSaveManager.enableAutoSave();
        } else {
          this.autoSaveManager.disableAutoSave();
        }
      });
    }

    const showSuggestionsInput = document.getElementById('showSuggestions') as HTMLInputElement | null;
    if (showSuggestionsInput) {
      showSuggestionsInput.addEventListener('change', () => {
        if (showSuggestionsInput.checked) {
          this.autoSaveManager.enableSuggestions();
        } else {
          this.autoSaveManager.disableSuggestions();
        }
      });
    }

    const showFloatingButtonInput = document.getElementById('showFloatingButton') as HTMLInputElement | null;
    if (showFloatingButtonInput) {
      showFloatingButtonInput.addEventListener('change', () => {
        if (showFloatingButtonInput.checked) {
          this.autoSaveManager.enableFloatingButton();
        } else {
          this.autoSaveManager.disableFloatingButton();
        }
      });
    }
  }

  /**
   * 检查是否首次使用
   */
  private checkFirstTimeUser(): void {
    try {
      const hasSeenOnboarding = localStorage.getItem('hasSeenAutoSaveOnboarding');
      if (!hasSeenOnboarding) {
        // 延迟显示，避免与其他初始化冲突
        setTimeout(() => {
          import('../shared/toast').then(({ toast }) => {
            toast.info(
              '💡 提示：验证成功后会自动保存配置，您可以在"保存设置"区域关闭此功能',
              5000
            );
          }).catch(error => {
            console.error('加载 toast 模块失败:', error);
          });
        }, 1000);
        
        localStorage.setItem('hasSeenAutoSaveOnboarding', 'true');
      }
    } catch (error) {
      console.error('检查首次使用状态失败:', error);
    }
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    // 简单的提示实现
    alert(message);
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    alert('错误: ' + message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
