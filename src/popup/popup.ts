import type { ProviderConfigMap, ProviderInstanceConfig, TranslationSettings } from '../shared/config-manager';
import { ConfigManager } from '../shared/config-manager';
import { StorageManager } from '../shared/storage';
import type { ProviderInfo, StatsSnapshot } from '../translation/interfaces/types';

type ProviderCategory = ProviderInfo['category'];

type ProviderSummary = {
  id: string;
  displayName: string;
  category: ProviderCategory;
  documentation?: string;
  homepage?: string;
  [key: string]: unknown;
};

interface PopupCacheStats {
  size: number;
  maxSize: number;
  ttl: number;
  usage: string;
}

type PopupStats = StatsSnapshot & {
  cache?: PopupCacheStats;
};

interface RuntimeResponse<T> {
  success: boolean;
  data?: T;
  error?: unknown;
}

const qs = <T extends Element>(selector: string, root: Document | Element = document): T | null =>
  root.querySelector(selector);

const getById = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

const setText = (id: string, value: string | number): void => {
  const element = getById<HTMLElement>(id);
  if (element) {
    element.textContent = String(value);
  }
};

const sendRuntimeMessage = async <T>(message: unknown): Promise<T> => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('chrome.runtime unavailable');
  }

  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
};

class PopupManager {
  private readonly storage = new StorageManager();

  private providers: ProviderSummary[] = [];

  private settings: TranslationSettings = ConfigManager.getDefaults();

  private stats: PopupStats | null = null;

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.loadProviders();
      await this.loadSettings();
      this.initializeUI();
      this.bindEvents();
      await this.loadStats();
      console.log('Popup initialized');
    } catch (error) {
      console.error('初始化失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.showError(`初始化失败: ${message}`);
    }
  }

  private async loadProviders(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      this.providers = this.getDefaultProviders();
      return;
    }

    try {
      const response = await sendRuntimeMessage<RuntimeResponse<ProviderSummary[]>>({
        action: 'getAvailableProviders'
      });

      if (response.success && Array.isArray(response.data)) {
        this.providers = response.data;
      } else {
        this.providers = this.getDefaultProviders();
      }
    } catch (error) {
      console.error('加载提供商列表失败:', error);
      this.providers = this.getDefaultProviders();
    }
  }

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
      { id: 'gemini', displayName: 'Gemini AI', category: 'ai' }
    ];
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await this.storage.getSettings();
    } catch (error) {
      console.error('加载设置失败:', error);
      this.settings = ConfigManager.getDefaults();
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const saved = await this.storage.saveSettings(this.settings);
      if (saved) {
        this.showSuccess('设置已保存');
      } else {
        this.showError('保存失败: 无法写入存储');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.showError(`保存失败: ${message}`);
    }
  }

  private initializeUI(): void {
    this.initializeTabs();
    this.initializeProviderCards();
    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
    this.loadSettingsToUI();
  }

  private initializeTabs(): void {
    const tabs = document.querySelectorAll<HTMLElement>('.tab');
    const panels = document.querySelectorAll<HTMLElement>('.tab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((item) => item.classList.remove('active'));
        panels.forEach((panel) => panel.classList.remove('active'));

        tab.classList.add('active');
        const panelId = tab.dataset.tab ? `panel-${tab.dataset.tab}` : '';
        if (panelId) {
          getById<HTMLElement>(panelId)?.classList.add('active');
        }
      });
    });
  }

  private initializeProviderCards(): void {
    const cards = document.querySelectorAll<HTMLElement>('.provider-card');

    cards.forEach((card) => {
      const header = qs<HTMLElement>('.provider-header', card);
      const configSection = qs<HTMLElement>('.provider-config', card);

      header?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.classList.contains('provider-toggle') || target?.classList.contains('slider')) {
          return;
        }
        configSection?.classList.toggle('collapsed');
      });

      const toggle = qs<HTMLInputElement>('.provider-toggle', card);
      toggle?.addEventListener('change', (event) => {
        const input = event.target as HTMLInputElement;
        const providerId = input.dataset.provider;
        if (providerId) {
          this.handleProviderToggle(providerId, input.checked);
        }
      });

      const validateBtn = qs<HTMLButtonElement>('.btn-validate', card);
      validateBtn?.addEventListener('click', () => {
        const providerId = validateBtn.dataset.provider;
        if (providerId) {
          void this.validateProvider(providerId);
        }
      });

      const quotaBtn = qs<HTMLButtonElement>('.btn-quota', card);
      quotaBtn?.addEventListener('click', () => {
        const providerId = quotaBtn.dataset.provider;
        if (providerId) {
          void this.checkQuota(providerId);
        }
      });

      const docsBtn = qs<HTMLButtonElement>('.btn-docs', card);
      docsBtn?.addEventListener('click', () => {
        const providerId = docsBtn.dataset.provider;
        const provider = this.providers.find((item) => item.id === providerId);
        if (provider?.documentation) {
          window.open(provider.documentation, '_blank', 'noopener');
        }
      });

      const togglePasswordBtns = card.querySelectorAll<HTMLButtonElement>('.toggle-password');
      togglePasswordBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const input = btn.previousElementSibling as HTMLInputElement | null;
          if (!input) return;
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.textContent = isPassword ? '🙈' : '👁️';
        });
      });
    });
  }

  private updatePrimaryProviderSelect(): void {
    const select = getById<HTMLSelectElement>('primaryProvider');
    if (!select) return;

    select.innerHTML = '<option value="">请先配置翻译服务</option>';
    const providerConfigs = this.settings.providers || {};

    const enabledProviders = this.providers.filter(
      (provider) => providerConfigs[provider.id]?.enabled
    );

    enabledProviders.forEach((provider) => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = provider.displayName;
      if (this.settings.primaryProvider === provider.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  private updateFallbackList(): void {
    const list = getById<HTMLElement>('fallbackList');
    if (!list) return;

    const fallbackProviders = this.settings.fallbackProviders ?? [];

    if (fallbackProviders.length === 0) {
      list.innerHTML = '<p class="empty-state">未配置备用服务</p>';
      return;
    }

    list.innerHTML = '';
    fallbackProviders.forEach((providerId, index) => {
      const provider = this.providers.find((item) => item.id === providerId);
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

    this.bindFallbackActions();
  }

  private bindFallbackActions(): void {
    const list = getById<HTMLElement>('fallbackList');
    if (!list) return;

    list.querySelectorAll<HTMLButtonElement>('.btn-move-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        if (!Number.isNaN(index)) {
          this.moveFallbackProvider(index, -1);
        }
      });
    });

    list.querySelectorAll<HTMLButtonElement>('.btn-move-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        if (!Number.isNaN(index)) {
          this.moveFallbackProvider(index, 1);
        }
      });
    });

    list.querySelectorAll<HTMLButtonElement>('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
        if (!Number.isNaN(index)) {
          this.removeFallbackProvider(index);
        }
      });
    });
  }

  private moveFallbackProvider(index: number, direction: number): void {
    const fallbacks = [...(this.settings.fallbackProviders ?? [])];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= fallbacks.length) return;

    const [current] = fallbacks.splice(index, 1);
    fallbacks.splice(newIndex, 0, current);

    this.settings.fallbackProviders = fallbacks;
    this.updateFallbackList();
  }

  private removeFallbackProvider(index: number): void {
    const fallbacks = [...(this.settings.fallbackProviders ?? [])];
    if (index < 0 || index >= fallbacks.length) return;

    fallbacks.splice(index, 1);
    this.settings.fallbackProviders = fallbacks;
    this.updateFallbackList();
  }

  private handleProviderToggle(providerId: string, enabled: boolean): void {
    if (!this.settings.providers) {
      this.settings.providers = {};
    }
    if (!this.settings.providers[providerId]) {
      this.settings.providers[providerId] = { enabled };
    } else {
      this.settings.providers[providerId].enabled = enabled;
    }

    if (!enabled && this.settings.primaryProvider === providerId) {
      const enabledProviders = Object.entries(this.settings.providers)
        .filter(([, config]) => config.enabled)
        .map(([id]) => id);
      this.settings.primaryProvider = enabledProviders[0] ?? '';
    }

    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
  }

  private async validateProvider(providerId: string): Promise<void> {
    const statusEl = document.querySelector<HTMLElement>(
      `.validation-status[data-provider="${providerId}"]`
    );
    if (!statusEl) return;

    statusEl.textContent = '验证中...';
    statusEl.className = 'validation-status validating';

    try {
      const config = this.collectProviderConfig(providerId);
      const response = await sendRuntimeMessage<RuntimeResponse<{ valid: boolean }>>({
        action: 'validateProvider',
        providerId,
        config
      });

      if (response.success && response.data?.valid) {
        statusEl.textContent = '✓ 验证成功';
        statusEl.className = 'validation-status success';
      } else {
        statusEl.textContent = '✗ 验证失败';
        statusEl.className = 'validation-status error';
      }
    } catch (error) {
      console.error('验证失败:', error);
      statusEl.textContent = '✗ 验证出错';
      statusEl.className = 'validation-status error';
    }
  }

  private async checkQuota(providerId: string): Promise<void> {
    try {
      const response = await sendRuntimeMessage<RuntimeResponse<{ used: number; limit: number } | null>>({
        action: 'getQuota',
        providerId
      });

      if (response.success && response.data) {
        const quota = response.data;
        const percent = quota.limit > 0 ? ((quota.used / quota.limit) * 100).toFixed(1) : '0';
        // eslint-disable-next-line no-alert
        alert(`配额使用情况:\n已使用: ${quota.used}\n总限额: ${quota.limit}\n使用率: ${percent}%`);
      } else {
        // eslint-disable-next-line no-alert
        alert('该服务不支持配额查询');
      }
    } catch (error) {
      console.error('查询配额失败:', error);
      // eslint-disable-next-line no-alert
      alert('查询配额失败');
    }
  }

  private collectProviderConfig(providerId: string): Partial<ProviderInstanceConfig> {
    const card = document.querySelector<HTMLElement>(`.provider-card[data-provider="${providerId}"]`);
    if (!card) return {};

    const config: Partial<ProviderInstanceConfig> = {};

    const apiKeyInput = qs<HTMLInputElement>('.api-key', card);
    if (apiKeyInput) {
      config.apiKey = apiKeyInput.value.trim();
    }

    const inputs = card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]');
    inputs.forEach((input) => {
      const field = input.getAttribute('data-field');
      if (!field) return;
      config[field] = input.value.trim();
    });

    return config;
  }

  private loadSettingsToUI(): void {
    const targetSelect = getById<HTMLSelectElement>('targetLanguage');
    if (targetSelect) {
      targetSelect.value = this.settings.targetLanguage || 'zh-CN';
    }

    const sourceSelect = getById<HTMLSelectElement>('sourceLanguage');
    if (sourceSelect) {
      sourceSelect.value = this.settings.sourceLanguage || 'auto';
    }

    const enableCache = getById<HTMLInputElement>('enableCache');
    if (enableCache) {
      enableCache.checked = this.settings.enableCache !== false;
    }

    const autoDetect = getById<HTMLInputElement>('autoDetect');
    if (autoDetect) {
      autoDetect.checked = this.settings.autoDetect !== false;
    }

    const showOriginal = getById<HTMLInputElement>('showOriginal');
    if (showOriginal) {
      showOriginal.checked = this.settings.showOriginal !== false;
    }

    if (this.settings.formality) {
      const formalityRadio = document.querySelector<HTMLInputElement>(
        `input[name="formality"][value="${this.settings.formality}"]`
      );
      if (formalityRadio) {
        formalityRadio.checked = true;
      }
    }

    const domainSelect = getById<HTMLSelectElement>('domain');
    if (domainSelect) {
      domainSelect.value = this.settings.domain || 'general';
    }

    const timeoutInput = getById<HTMLInputElement>('timeout');
    if (timeoutInput) {
      timeoutInput.value = String(Math.floor((this.settings.timeout ?? 30_000) / 1000));
    }

    const retryInput = getById<HTMLInputElement>('retryCount');
    if (retryInput) {
      retryInput.value = String(this.settings.retryCount ?? 3);
    }

    const parallelToggle = getById<HTMLInputElement>('parallelTranslation');
    if (parallelToggle) {
      parallelToggle.checked = this.settings.parallelTranslation ?? false;
    }

    const autoFallbackToggle = getById<HTMLInputElement>('autoFallback');
    if (autoFallbackToggle) {
      autoFallbackToggle.checked = this.settings.autoFallback !== false;
    }

    if (this.settings.providers) {
      Object.entries(this.settings.providers).forEach(([providerId, config]) => {
        const toggle = document.querySelector<HTMLInputElement>(
          `.provider-toggle[data-provider="${providerId}"]`
        );
        if (toggle) {
          toggle.checked = config.enabled ?? false;
        }

        const card = document.querySelector<HTMLElement>(
          `.provider-card[data-provider="${providerId}"]`
        );
        if (!card) return;

        const apiKeyInput = qs<HTMLInputElement>('.api-key', card);
        if (apiKeyInput && typeof config.apiKey === 'string') {
          apiKeyInput.value = config.apiKey;
        }

        const inputs = card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]');
        inputs.forEach((input) => {
          const field = input.getAttribute('data-field');
          if (!field) return;
          const value = config[field];
          if (typeof value === 'string') {
            input.value = value;
          }
        });
      });
    }
  }

  private collectSettings(): TranslationSettings {
    const defaults = ConfigManager.getDefaults();
    const current = this.settings;
    const settings: TranslationSettings = {
      ...defaults,
      ...current,
      fallbackProviders: [...(current.fallbackProviders ?? [])],
      providers: {}
    };

    const targetSelect = getById<HTMLSelectElement>('targetLanguage');
    if (targetSelect) {
      settings.targetLanguage = targetSelect.value as TranslationSettings['targetLanguage'];
    }

    const sourceSelect = getById<HTMLSelectElement>('sourceLanguage');
    if (sourceSelect) {
      settings.sourceLanguage = sourceSelect.value as TranslationSettings['sourceLanguage'];
    }

    const enableCache = getById<HTMLInputElement>('enableCache');
    settings.enableCache = enableCache ? enableCache.checked : settings.enableCache;

    const autoDetect = getById<HTMLInputElement>('autoDetect');
    settings.autoDetect = autoDetect ? autoDetect.checked : settings.autoDetect;

    const showOriginal = getById<HTMLInputElement>('showOriginal');
    settings.showOriginal = showOriginal ? showOriginal.checked : settings.showOriginal;

    const formalityRadio = document.querySelector<HTMLInputElement>('input[name="formality"]:checked');
    if (formalityRadio) {
      settings.formality = formalityRadio.value;
    }

    const domainSelect = getById<HTMLSelectElement>('domain');
    if (domainSelect) {
      settings.domain = domainSelect.value;
    }

    const timeoutInput = getById<HTMLInputElement>('timeout');
    if (timeoutInput) {
      const seconds = Number.parseInt(timeoutInput.value, 10);
      settings.timeout = Number.isFinite(seconds) ? seconds * 1000 : settings.timeout;
    }

    const retryInput = getById<HTMLInputElement>('retryCount');
    if (retryInput) {
      const retry = Number.parseInt(retryInput.value, 10);
      settings.retryCount = Number.isFinite(retry) ? retry : settings.retryCount;
    }

    const parallelToggle = getById<HTMLInputElement>('parallelTranslation');
    settings.parallelTranslation = parallelToggle ? parallelToggle.checked : settings.parallelTranslation;

    const autoFallbackToggle = getById<HTMLInputElement>('autoFallback');
    settings.autoFallback = autoFallbackToggle ? autoFallbackToggle.checked : settings.autoFallback;

    const primarySelect = getById<HTMLSelectElement>('primaryProvider');
    settings.primaryProvider = primarySelect ? primarySelect.value : settings.primaryProvider;

    const providerConfigs: ProviderConfigMap = {};
    const cards = document.querySelectorAll<HTMLElement>('.provider-card');
    cards.forEach((card) => {
      const providerId = card.dataset.provider;
      if (!providerId) return;

      const toggle = qs<HTMLInputElement>('.provider-toggle', card);
      const config = this.collectProviderConfig(providerId);
      providerConfigs[providerId] = {
        ...(current.providers?.[providerId] ?? {}),
        ...config,
        enabled: toggle?.checked ?? false
      };
    });

    settings.providers = providerConfigs;
    return settings;
  }

  private async loadStats(): Promise<void> {
    try {
      const response = await sendRuntimeMessage<RuntimeResponse<PopupStats>>({
        action: 'getTranslationStats'
      });

      if (response.success && response.data) {
        this.stats = response.data;
        this.updateStatsUI();
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }

  private updateStatsUI(): void {
    if (!this.stats) return;

    const { total, today, cache, byProvider } = this.stats;

    setText('totalRequests', total.requests ?? 0);
    setText('totalCharacters', total.characters ?? 0);
    setText('totalCost', `$${(total.cost ?? 0).toFixed(4)}`);

    const successRate =
      total.requests > 0 ? ((total.successes / total.requests) * 100).toFixed(1) : '0.0';
    setText('successRate', `${successRate}%`);

    setText('todayRequests', today.requests ?? 0);
    setText('todayCharacters', today.characters ?? 0);
    setText('todayCost', `$${(today.cost ?? 0).toFixed(4)}`);

    setText('cacheSize', cache?.size ?? 0);
    setText('cacheUsage', cache?.usage ?? '0%');

    this.updateProviderStats(byProvider ?? {});
  }

  private updateProviderStats(providerStats: PopupStats['byProvider']): void {
    const list = getById<HTMLElement>('providerStatsList');
    if (!list) return;

    const entries = Object.entries(providerStats);
    if (entries.length === 0) {
      list.innerHTML = '<p class="empty-state">暂无统计数据</p>';
      return;
    }

    list.innerHTML = '';
    entries.forEach(([providerId, stats]) => {
      const provider = this.providers.find((item) => item.id === providerId);
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

  private bindEvents(): void {
    getById<HTMLButtonElement>('saveSettings')?.addEventListener('click', async () => {
      const nextSettings = this.collectSettings();
      this.settings = nextSettings;
      await this.saveSettings();

      try {
        await sendRuntimeMessage<RuntimeResponse<unknown>>({
          action: 'updateTranslationConfig',
          settings: this.settings
        });
      } catch (error) {
        console.error('更新后台配置失败:', error);
        this.showError('更新后台配置失败，请检查后台页面日志');
      }
    });

    getById<HTMLButtonElement>('resetSettings')?.addEventListener('click', () => {
      // eslint-disable-next-line no-alert
      if (confirm('确定要重置所有设置吗？')) {
        this.settings = ConfigManager.getDefaults();
        this.loadSettingsToUI();
        this.updatePrimaryProviderSelect();
        this.updateFallbackList();
      }
    });

    getById<HTMLSelectElement>('primaryProvider')?.addEventListener('change', (event) => {
      const select = event.target as HTMLSelectElement;
      this.settings.primaryProvider = select.value;
    });

    getById<HTMLButtonElement>('clearCache')?.addEventListener('click', async () => {
      try {
        await sendRuntimeMessage<RuntimeResponse<unknown>>({ action: 'clearCache' });
        this.showSuccess('缓存已清空');
        await this.loadStats();
      } catch (error) {
        console.error('清空缓存失败:', error);
        this.showError('清空缓存失败');
      }
    });

    getById<HTMLButtonElement>('clearStats')?.addEventListener('click', async () => {
      // eslint-disable-next-line no-alert
      if (!confirm('确定要清空所有统计数据吗？')) {
        return;
      }
      try {
        await sendRuntimeMessage<RuntimeResponse<unknown>>({ action: 'clearStats' });
        this.showSuccess('统计已清空');
        await this.loadStats();
      } catch (error) {
        console.error('清空统计失败:', error);
        this.showError('清空统计失败');
      }
    });

    getById<HTMLButtonElement>('exportStats')?.addEventListener('click', () => {
      if (!this.stats) return;
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

  private showSuccess(message: string): void {
    // eslint-disable-next-line no-alert
    alert(message);
  }

  private showError(message: string): void {
    // eslint-disable-next-line no-alert
    alert(`错误: ${message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new PopupManager();
});
