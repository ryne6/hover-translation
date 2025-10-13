/**
 * 弹窗管理器（新版）
 * 支持多翻译引擎配置
 */
class PopupManager {
  constructor() {
    this.providers = [];
    this.settings = {};
    this.stats = null;
    
    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    try {
      // 从后台服务获取所有可用的提供商
      await this.loadProviders();
      console.log('Available providers:', this.providers);

      // 加载用户设置
      await this.loadSettings();

      // 初始化 UI
      this.initializeUI();

      // 绑定事件
      this.bindEvents();

      // 加载统计信息
      await this.loadStats();

      console.log('Popup initialized');
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败: ' + error.message);
    }
  }

  /**
   * 加载提供商列表
   */
  async loadProviders() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ 
          action: 'getAvailableProviders' 
        });
        if (response.success) {
          this.providers = response.data || [];
        } else {
          // 如果获取失败，使用硬编码的提供商列表
          this.providers = this.getDefaultProviders();
        }
      } else {
        // 测试环境
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
  getDefaultProviders() {
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
  async loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.sync.get(null);
      this.settings = result || {};
    } else {
      // 测试环境
      this.settings = {};
    }
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set(this.settings);
        this.showSuccess('设置已保存');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showError('保存失败: ' + error.message);
    }
  }

  /**
   * 初始化 UI
   */
  initializeUI() {
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
  initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // 移除所有激活状态
        navItems.forEach(n => n.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));

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
  initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除所有激活状态
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

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
  initializeProviderCards() {
    const cards = document.querySelectorAll('.provider-card');

    cards.forEach(card => {
      const header = card.querySelector('.provider-header');
      const config = card.querySelector('.provider-config');

      // 点击头部展开/折叠配置
      header.addEventListener('click', (e) => {
        // 如果点击的是开关，不触发展开/折叠
        if (e.target.classList.contains('provider-toggle') || 
            e.target.classList.contains('slider')) {
          return;
        }

        config.classList.toggle('collapsed');
      });

      // 开关切换事件
      const toggle = card.querySelector('.provider-toggle');
      toggle?.addEventListener('change', (e) => {
        const providerId = e.target.dataset.provider;
        this.handleProviderToggle(providerId, e.target.checked);
      });

      // 验证按钮
      const validateBtn = card.querySelector('.btn-validate');
      validateBtn?.addEventListener('click', () => {
        const providerId = validateBtn.dataset.provider;
        this.validateProvider(providerId);
      });

      // 配额按钮
      const quotaBtn = card.querySelector('.btn-quota');
      quotaBtn?.addEventListener('click', () => {
        const providerId = quotaBtn.dataset.provider;
        this.checkQuota(providerId);
      });

      // 文档按钮
      const docsBtn = card.querySelector('.btn-docs');
      docsBtn?.addEventListener('click', () => {
        const providerId = docsBtn.dataset.provider;
        const provider = this.providers.find(p => p.id === providerId);
        if (provider?.documentation) {
          window.open(provider.documentation, '_blank');
        }
      });

      // 显示/隐藏密码
      const togglePasswordBtns = card.querySelectorAll('.toggle-password');
      togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const input = e.target.previousElementSibling;
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
  updatePrimaryProviderSelect() {
    const select = document.getElementById('primaryProvider');
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
  updateFallbackList() {
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
  bindFallbackActions() {
    const list = document.getElementById('fallbackList');
    if (!list) return;

    list.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.moveFallbackProvider(index, -1);
      });
    });

    list.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.moveFallbackProvider(index, 1);
      });
    });

    list.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.removeFallbackProvider(index);
      });
    });
  }

  /**
   * 移动备用服务位置
   */
  moveFallbackProvider(index, direction) {
    const fallbacks = this.settings.fallbackProviders || [];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= fallbacks.length) return;

    const temp = fallbacks[index];
    fallbacks[index] = fallbacks[newIndex];
    fallbacks[newIndex] = temp;

    this.settings.fallbackProviders = fallbacks;
    this.updateFallbackList();
  }

  /**
   * 移除备用服务
   */
  removeFallbackProvider(index) {
    const fallbacks = this.settings.fallbackProviders || [];
    fallbacks.splice(index, 1);
    this.settings.fallbackProviders = fallbacks;
    this.updateFallbackList();
  }

  /**
   * 处理提供商开关切换
   */
  handleProviderToggle(providerId, enabled) {
    if (!this.settings.providers) {
      this.settings.providers = {};
    }
    if (!this.settings.providers[providerId]) {
      this.settings.providers[providerId] = {};
    }

    this.settings.providers[providerId].enabled = enabled;

    // 如果禁用了主要服务，需要切换
    if (!enabled && this.settings.primaryProvider === providerId) {
      const enabledProviders = Object.entries(this.settings.providers)
        .filter(([id, config]) => config.enabled)
        .map(([id]) => id);
      
      this.settings.primaryProvider = enabledProviders[0] || '';
    }

    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
  }

  /**
   * 验证提供商配置
   */
  async validateProvider(providerId) {
    const statusEl = document.querySelector(`.validation-status[data-provider="${providerId}"]`);
    if (!statusEl) return;

    statusEl.textContent = '验证中...';
    statusEl.className = 'validation-status validating';

    try {
      // 收集配置
      const config = this.collectProviderConfig(providerId);

      // 调用后台服务验证
      const response = await chrome.runtime.sendMessage({
        action: 'validateProvider',
        providerId: providerId,
        config: config,
      });

      if (response.success && response.data.valid) {
        statusEl.textContent = '✓ 验证成功';
        statusEl.className = 'validation-status success';

        // 验证成功后自动启用服务
        const toggle = document.querySelector(`.provider-toggle[data-provider="${providerId}"]`);
        if (toggle && !toggle.checked) {
          toggle.checked = true;
          this.handleProviderToggle(providerId, true);
        }

        // 保存配置到内存
        if (!this.settings.providers) {
          this.settings.providers = {};
        }
        if (!this.settings.providers[providerId]) {
          this.settings.providers[providerId] = {};
        }
        this.settings.providers[providerId] = {
          ...this.settings.providers[providerId],
          ...config,
          enabled: true,
        };

        // 提示用户保存
        this.showSuccess('验证成功！请点击下方"保存所有设置"按钮以应用配置');
      } else {
        statusEl.textContent = '✗ 验证失败: ' + (response.data?.message || '未知错误');
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
  async checkQuota(providerId) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getQuota',
        providerId: providerId,
      });

      if (response.success && response.data) {
        const quota = response.data;
        const percent = ((quota.used / quota.limit) * 100).toFixed(1);
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
  collectProviderConfig(providerId) {
    const card = document.querySelector(`.provider-card[data-provider="${providerId}"]`);
    if (!card) return {};

    const config = {};
    
    // 收集所有字段
    const inputs = card.querySelectorAll('[data-field]');
    inputs.forEach(input => {
      const field = input.dataset.field;
      config[field] = input.value.trim();
    });

    // 处理不同服务的特殊字段映射
    if (providerId === 'youdao') {
      // 有道翻译：appId → apiKey, secret → apiSecret
      config.apiKey = config.appId || '';
      config.apiSecret = config.secret || '';
    } else if (providerId === 'baidu') {
      // 百度翻译：appId → apiKey, secret → apiSecret
      config.apiKey = config.appId || '';
      config.apiSecret = config.secret || '';
    } else if (providerId === 'tencent') {
      // 腾讯翻译：secretId → apiKey, secretKey → apiSecret
      config.apiKey = config.secretId || '';
      config.apiSecret = config.secretKey || '';
    } else if (providerId === 'microsoft') {
      // Microsoft：从 .api-key 获取
      const apiKeyInput = card.querySelector('.api-key');
      if (apiKeyInput) {
        config.apiKey = apiKeyInput.value.trim();
      }
    } else {
      // 其他服务：从 .api-key 获取 apiKey
      const apiKeyInput = card.querySelector('.api-key');
      if (apiKeyInput) {
        config.apiKey = apiKeyInput.value.trim();
      }
    }

    return config;
  }

  /**
   * 加载设置到 UI
   */
  loadSettingsToUI() {
    // 加载基础设置
    document.getElementById('targetLanguage').value = this.settings.targetLanguage || 'zh-CN';
    document.getElementById('sourceLanguage').value = this.settings.sourceLanguage || 'auto';
    document.getElementById('enableCache').checked = this.settings.enableCache !== false;
    document.getElementById('autoDetect').checked = this.settings.autoDetect !== false;
    document.getElementById('showOriginal').checked = this.settings.showOriginal !== false;

    // 加载高级设置
    if (this.settings.formality) {
      document.querySelector(`input[name="formality"][value="${this.settings.formality}"]`).checked = true;
    }
    document.getElementById('domain').value = this.settings.domain || 'general';
    document.getElementById('timeout').value = this.settings.timeout || 30;
    document.getElementById('retryCount').value = this.settings.retryCount || 3;
    document.getElementById('parallelTranslation').checked = this.settings.parallelTranslation || false;
    document.getElementById('autoFallback').checked = this.settings.autoFallback !== false;

    // 加载提供商配置
    if (this.settings.providers) {
      Object.entries(this.settings.providers).forEach(([providerId, config]) => {
        const toggle = document.querySelector(`.provider-toggle[data-provider="${providerId}"]`);
        if (toggle) {
          toggle.checked = config.enabled || false;
        }

        const card = document.querySelector(`.provider-card[data-provider="${providerId}"]`);
        if (!card) return;

        // 加载 API Key
        const apiKeyInput = card.querySelector('.api-key');
        if (apiKeyInput && config.apiKey) {
          apiKeyInput.value = config.apiKey;
        }

        // 加载其他字段
        if (config.appId) {
          const appIdInput = card.querySelector('[data-field="appId"]');
          if (appIdInput) appIdInput.value = config.appId;
        }
        if (config.secret) {
          const secretInput = card.querySelector('[data-field="secret"]');
          if (secretInput) secretInput.value = config.secret;
        }
        if (config.apiSecret) {
          const apiSecretInput = card.querySelector('[data-field="apiSecret"]');
          if (apiSecretInput) apiSecretInput.value = config.apiSecret;
        }
        if (config.region) {
          const regionSelect = card.querySelector('[data-field="region"]');
          if (regionSelect) regionSelect.value = config.region;
        }
        if (config.model) {
          const modelSelect = card.querySelector('[data-field="model"]');
          if (modelSelect) modelSelect.value = config.model;
        }
      });
    }

    // 重要：加载完配置后，需要更新下拉框
    this.updatePrimaryProviderSelect();
    this.updateFallbackList();
  }

  /**
   * 从 UI 收集设置
   */
  collectSettings() {
    const settings = {};

    // 基础设置
    settings.targetLanguage = document.getElementById('targetLanguage').value;
    settings.sourceLanguage = document.getElementById('sourceLanguage').value;
    settings.enableCache = document.getElementById('enableCache').checked;
    settings.autoDetect = document.getElementById('autoDetect').checked;
    settings.showOriginal = document.getElementById('showOriginal').checked;

    // 高级设置
    settings.formality = document.querySelector('input[name="formality"]:checked').value;
    settings.domain = document.getElementById('domain').value;
    settings.timeout = parseInt(document.getElementById('timeout').value) * 1000;
    settings.retryCount = parseInt(document.getElementById('retryCount').value);
    settings.parallelTranslation = document.getElementById('parallelTranslation').checked;
    settings.autoFallback = document.getElementById('autoFallback').checked;

    // 主要服务
    settings.primaryProvider = document.getElementById('primaryProvider').value;

    // 备用服务
    settings.fallbackProviders = this.settings.fallbackProviders || [];

    // 提供商配置
    settings.providers = {};
    const cards = document.querySelectorAll('.provider-card');
    
    cards.forEach(card => {
      const providerId = card.dataset.provider;
      const toggle = card.querySelector('.provider-toggle');
      
      settings.providers[providerId] = {
        enabled: toggle?.checked || false,
        ...this.collectProviderConfig(providerId),
      };
    });

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
    document.getElementById('totalRequests').textContent = this.stats.total.requests || 0;
    document.getElementById('totalCharacters').textContent = this.stats.total.characters || 0;
    document.getElementById('totalCost').textContent = '$' + (this.stats.total.cost || 0).toFixed(4);
    
    const successRate = this.stats.total.requests > 0
      ? ((this.stats.total.successes / this.stats.total.requests) * 100).toFixed(1)
      : 0;
    document.getElementById('successRate').textContent = successRate + '%';

    // 今日统计
    document.getElementById('todayRequests').textContent = this.stats.today.requests || 0;
    document.getElementById('todayCharacters').textContent = this.stats.today.characters || 0;
    document.getElementById('todayCost').textContent = '$' + (this.stats.today.cost || 0).toFixed(4);

    // 缓存统计
    const cacheStats = this.stats.cache || {};
    document.getElementById('cacheSize').textContent = cacheStats.size || 0;
    document.getElementById('cacheUsage').textContent = cacheStats.usage || '0%';

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
   * 绑定事件
   */
  bindEvents() {
    // 保存设置
    document.getElementById('saveSettings')?.addEventListener('click', async () => {
      const btn = document.getElementById('saveSettings');
      const originalText = btn.textContent;
      
      try {
        // 显示加载状态
        btn.disabled = true;
        btn.textContent = '⏳ 保存中...';
        
        // 1. 收集所有设置
        this.settings = this.collectSettings();
        
        // 2. 验证是否至少有一个启用的服务
        const enabledProviders = Object.entries(this.settings.providers || {})
          .filter(([id, config]) => config.enabled);
        
        if (enabledProviders.length === 0) {
          this.showError('请至少启用一个翻译服务！');
          btn.disabled = false;
          btn.textContent = originalText;
          return;
        }

        // 3. 如果没有选择主要服务，自动选择第一个启用的服务
        if (!this.settings.primaryProvider) {
          this.settings.primaryProvider = enabledProviders[0][0];
          document.getElementById('primaryProvider').value = this.settings.primaryProvider;
        }
        
        // 4. 通知后台保存并重新初始化（后台会负责保存到 Chrome Storage）
        const response = await chrome.runtime.sendMessage({
          action: 'updateTranslationConfig',
          settings: this.settings,
        });

        if (response?.success) {
          btn.textContent = '✅ 已保存';
          this.showSuccess('设置已保存并应用！现在可以使用翻译功能了 🎉');
          
          // 2秒后恢复按钮
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
          }, 2000);
        } else {
          btn.textContent = '❌ 保存失败';
          this.showError('保存失败: ' + (response?.error || '未知错误'));
          
          // 2秒后恢复按钮
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
          }, 2000);
        }
      } catch (error) {
        console.error('保存设置失败:', error);
        btn.textContent = '❌ 保存失败';
        this.showError('保存失败: ' + error.message);
        
        // 2秒后恢复按钮
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = originalText;
        }, 2000);
      }
    });

    // 重置设置
    document.getElementById('resetSettings')?.addEventListener('click', () => {
      if (confirm('确定要重置所有设置吗？')) {
        this.settings = {};
        this.loadSettingsToUI();
      }
    });

    // 主要服务选择
    document.getElementById('primaryProvider')?.addEventListener('change', (e) => {
      this.settings.primaryProvider = e.target.value;
    });

    // 清空缓存
    document.getElementById('clearCache')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'clearCache' });
      this.showSuccess('缓存已清空');
      await this.loadStats();
    });

    // 清空统计
    document.getElementById('clearStats')?.addEventListener('click', async () => {
      if (confirm('确定要清空所有统计数据吗？')) {
        await chrome.runtime.sendMessage({ action: 'clearStats' });
        this.showSuccess('统计已清空');
        await this.loadStats();
      }
    });

    // 导出统计
    document.getElementById('exportStats')?.addEventListener('click', () => {
      const data = JSON.stringify(this.stats, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation-stats-${new Date().toISOString()}.json`;
      a.click();
    });
  }

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    // 简单的提示实现
    alert(message);
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    alert('错误: ' + message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
