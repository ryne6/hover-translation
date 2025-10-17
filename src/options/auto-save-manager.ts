import { toast } from '../shared/toast';
import { FloatingSaveButton } from '../shared/floating-save-button';
import { ConfigSuggestion } from '../shared/config-suggestion';
import type { TranslationSettings, ProviderInstanceConfig } from '../shared/config-manager';

/**
 * 自动保存管理器配置选项
 */
export interface AutoSaveManagerOptions {
  autoSaveEnabled?: boolean;
  showSuggestions?: boolean;
  showFloatingButton?: boolean;
  onSave?: (settings: TranslationSettings) => Promise<boolean>;
  onConfigChange?: (settings: TranslationSettings) => void;
}

/**
 * 自动保存管理器
 * 负责管理配置的自动保存、Toast 提示和浮动保存按钮
 */
export class AutoSaveManager {
  private autoSaveEnabled: boolean;

  private showSuggestions: boolean;

  private showFloatingButtonEnabled: boolean;

  private floatingButton: FloatingSaveButton | null = null;

  private currentSuggestion: ConfigSuggestion | null = null;

  private dismissedSuggestions: Set<string> = new Set();

  private settings: TranslationSettings | null = null;

  private onSaveCallback: (settings: TranslationSettings) => Promise<boolean>;

  private onConfigChangeCallback?: (settings: TranslationSettings) => void;

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: AutoSaveManagerOptions = {}) {
    this.autoSaveEnabled = options.autoSaveEnabled !== false;
    this.showSuggestions = options.showSuggestions !== false;
    this.showFloatingButtonEnabled = options.showFloatingButton !== false;
    this.onSaveCallback = options.onSave || (async () => false);
    this.onConfigChangeCallback = options.onConfigChange;
  }

  /**
   * 设置当前配置
   */
  setSettings(settings: TranslationSettings): void {
    this.settings = settings;
    
    // 从配置中加载用户偏好
    if (settings.autoSavePreferences) {
      this.autoSaveEnabled = settings.autoSavePreferences.autoSaveEnabled;
      this.showSuggestions = settings.autoSavePreferences.showSuggestions;
      this.showFloatingButtonEnabled = settings.autoSavePreferences.showFloatingButton;
    }
  }

  /**
   * 获取当前配置
   */
  getSettings(): TranslationSettings | null {
    return this.settings;
  }

  /**
   * 更新提供商配置
   */
  updateProviderConfig(providerId: string, config: ProviderInstanceConfig): void {
    if (!this.settings) return;

    if (!this.settings.providers) {
      this.settings.providers = {};
    }

    const existingConfig = this.settings.providers[providerId] || {};
    this.settings.providers[providerId] = {
      ...existingConfig,
      ...config,
      enabled: true
    };

    // 通知配置变更
    if (this.onConfigChangeCallback) {
      this.onConfigChangeCallback(this.settings);
    }
  }

  /**
   * 验证成功后的处理
   */
  async onValidationSuccess(providerId: string, config: ProviderInstanceConfig): Promise<void> {
    // 更新配置
    this.updateProviderConfig(providerId, config);

    // 如果启用了自动保存，则自动保存
    if (this.autoSaveEnabled) {
      await this.autoSave(providerId);
    } else {
      // 否则显示提示和浮动按钮
      toast.info('验证成功！请点击保存按钮以应用配置', 5000);
      this.showFloatingSaveButton();
    }
  }

  /**
   * 自动保存配置
   */
  private async autoSave(providerId?: string): Promise<void> {
    if (!this.settings) {
      console.error('[AutoSaveManager] 没有可保存的配置');
      return;
    }

    // 显示保存中提示
    this.showSavingToast();

    try {
      const success = await this.onSaveCallback(this.settings);

      if (success) {
        this.showSuccessToast();

        // 检查配置建议
        if (providerId && this.showSuggestions) {
          await this.checkConfigSuggestions(providerId);
        }
      } else {
        this.showErrorToast();
        this.showFloatingSaveButton();
      }
    } catch (error) {
      console.error('[AutoSaveManager] 保存失败:', error);
      this.showErrorToast();
      this.showFloatingSaveButton();
    }
  }

  /**
   * 显示保存中提示
   */
  private showSavingToast(): void {
    toast.info('⏳ 正在保存配置...', 0);
  }

  /**
   * 显示保存成功提示
   */
  private showSuccessToast(): void {
    toast.hideAll();
    toast.success('✅ 配置已自动保存', 2000);
  }

  /**
   * 显示保存失败提示
   */
  private showErrorToast(): void {
    toast.hideAll();
    toast.error('❌ 保存失败，请手动保存', 5000);
  }

  /**
   * 显示浮动保存按钮
   */
  private showFloatingSaveButton(): void {
    if (!this.showFloatingButtonEnabled) return;

    if (!this.floatingButton) {
      this.floatingButton = new FloatingSaveButton({
        text: '💾 保存配置',
        position: 'bottom-right',
        onClick: async () => {
          if (this.settings) {
            const success = await this.onSaveCallback(this.settings);
            if (success) {
              toast.success('配置已保存', 2000);
            } else {
              throw new Error('保存失败');
            }
          }
        }
      });
    }

    this.floatingButton.show();
  }

  /**
   * 隐藏浮动保存按钮
   */
  hideFloatingSaveButton(): void {
    if (this.floatingButton) {
      this.floatingButton.hide();
    }
  }

  /**
   * 检查配置建议
   */
  private async checkConfigSuggestions(providerId: string): Promise<void> {
    // 延迟检查，避免与保存成功提示冲突
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查有道翻译 → 有道 TTS 联动
    if (providerId === 'youdao') {
      await this.checkYoudaoTTSSuggestion();
    }
  }

  /**
   * 检查有道 TTS 建议
   */
  private async checkYoudaoTTSSuggestion(): Promise<void> {
    if (!this.settings) return;

    const suggestionId = 'youdao-tts-suggestion';
    
    // 如果用户已经忽略过这个建议，不再显示
    if (this.dismissedSuggestions.has(suggestionId)) {
      return;
    }

    const youdaoConfig = this.settings.providers?.youdao;
    const speechConfig = this.settings.speech;

    // 如果有道翻译已配置且启用，但 TTS 未启用或未使用有道
    if (
      youdaoConfig?.enabled &&
      youdaoConfig?.apiKey &&
      youdaoConfig?.apiSecret &&
      (!speechConfig?.enabled || speechConfig?.provider !== 'youdao')
    ) {
      this.showYoudaoTTSSuggestion(suggestionId);
    }
  }

  /**
   * 显示有道 TTS 建议
   */
  private showYoudaoTTSSuggestion(suggestionId: string): void {
    // 隐藏之前的建议
    if (this.currentSuggestion) {
      this.currentSuggestion.hide();
    }

    // 找到语音合成配置区域（在第一个 setting-group 之前插入）
    const speechPage = document.querySelector('#page-speech');
    const speechSection = speechPage?.querySelector('.setting-group');
    
    this.currentSuggestion = new ConfigSuggestion({
      type: 'info',
      message: '您已启用有道翻译服务，是否同时启用有道语音合成功能？使用有道 TTS 可以获得更自然的中英文语音效果。',
      actions: [
        {
          label: '一键启用',
          primary: true,
          handler: async () => {
            await this.enableYoudaoTTS();
          }
        },
        {
          label: '稍后配置',
          handler: () => {
            this.dismissSuggestion(suggestionId);
          }
        }
      ],
      dismissible: true,
      onDismiss: () => {
        this.dismissSuggestion(suggestionId);
      }
    });

    // 在语音合成区域之前显示建议
    if (speechSection) {
      this.currentSuggestion.show(speechSection as HTMLElement);
    } else {
      // 如果找不到语音合成区域，在页面中显示
      this.currentSuggestion.show();
    }
  }

  /**
   * 一键启用有道 TTS
   */
  private async enableYoudaoTTS(): Promise<void> {
    if (!this.settings) return;

    // 更新 speech 配置
    this.settings.speech = {
      enabled: true,
      provider: 'youdao',
      voiceName: 'youxiaoqin',
      speed: '1.0',
      volume: '1.0',
      format: 'mp3'
    };

    // 通知配置变更
    if (this.onConfigChangeCallback) {
      this.onConfigChangeCallback(this.settings);
    }

    // 保存配置
    toast.info('⏳ 正在保存配置...', 0);
    
    try {
      const success = await this.onSaveCallback(this.settings);
      
      if (success) {
        toast.hideAll();
        toast.success('✅ 有道语音合成已启用', 2000);
        
        // 更新 UI（如果有语音合成开关）
        const speechEnabledInput = document.getElementById('speechEnabled') as HTMLInputElement | null;
        const speechProviderSelect = document.getElementById('speechProvider') as HTMLSelectElement | null;
        
        if (speechEnabledInput) {
          speechEnabledInput.checked = true;
        }
        
        if (speechProviderSelect) {
          speechProviderSelect.value = 'youdao';
          // 触发 change 事件以更新 UI
          speechProviderSelect.dispatchEvent(new Event('change'));
        }
      } else {
        toast.hideAll();
        toast.error('❌ 保存失败，请手动保存', 3000);
      }
    } catch (error) {
      console.error('[AutoSaveManager] 启用有道 TTS 失败:', error);
      toast.hideAll();
      toast.error('❌ 启用失败，请手动配置', 3000);
    }
  }

  /**
   * 忽略建议
   */
  private dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestions.add(suggestionId);
    
    // 保存到 localStorage
    try {
      const dismissed = Array.from(this.dismissedSuggestions);
      localStorage.setItem('dismissedSuggestions', JSON.stringify(dismissed));
    } catch (error) {
      console.error('[AutoSaveManager] 保存忽略状态失败:', error);
    }
  }

  /**
   * 加载已忽略的建议
   */
  loadDismissedSuggestions(): void {
    try {
      const dismissed = localStorage.getItem('dismissedSuggestions');
      if (dismissed) {
        const list = JSON.parse(dismissed) as string[];
        this.dismissedSuggestions = new Set(list);
      }
    } catch (error) {
      console.error('[AutoSaveManager] 加载忽略状态失败:', error);
    }
  }

  /**
   * 启用自动保存
   */
  enableAutoSave(): void {
    this.autoSaveEnabled = true;
  }

  /**
   * 禁用自动保存
   */
  disableAutoSave(): void {
    this.autoSaveEnabled = false;
  }

  /**
   * 启用配置建议
   */
  enableSuggestions(): void {
    this.showSuggestions = true;
  }

  /**
   * 禁用配置建议
   */
  disableSuggestions(): void {
    this.showSuggestions = false;
  }

  /**
   * 启用浮动保存按钮
   */
  enableFloatingButton(): void {
    this.showFloatingButtonEnabled = true;
  }

  /**
   * 禁用浮动保存按钮
   */
  disableFloatingButton(): void {
    this.showFloatingButtonEnabled = false;
    this.hideFloatingSaveButton();
  }

  /**
   * 检查自动保存是否启用
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * 检查配置建议是否启用
   */
  isSuggestionsEnabled(): boolean {
    return this.showSuggestions;
  }

  /**
   * 检查浮动保存按钮是否启用
   */
  isFloatingButtonEnabled(): boolean {
    return this.showFloatingButtonEnabled;
  }

  /**
   * 检查有道翻译是否需要配置（反向检查）
   */
  checkYoudaoTranslationRequired(): void {
    if (!this.settings) return;

    const suggestionId = 'youdao-translation-required';
    
    // 如果用户已经忽略过这个建议，不再显示
    if (this.dismissedSuggestions.has(suggestionId)) {
      return;
    }

    const youdaoConfig = this.settings.providers?.youdao;
    const speechConfig = this.settings.speech;

    // 如果 TTS 启用了有道，但翻译服务未配置
    if (
      speechConfig?.enabled &&
      speechConfig?.provider === 'youdao' &&
      (!youdaoConfig?.enabled || !youdaoConfig?.apiKey || !youdaoConfig?.apiSecret)
    ) {
      this.showYoudaoTranslationRequiredWarning(suggestionId);
    }
  }

  /**
   * 显示有道翻译配置警告
   */
  private showYoudaoTranslationRequiredWarning(suggestionId: string): void {
    // 隐藏之前的建议
    if (this.currentSuggestion) {
      this.currentSuggestion.hide();
    }

    this.currentSuggestion = new ConfigSuggestion({
      type: 'warning',
      message: '有道语音合成需要有道翻译服务的 API 密钥。请先配置有道翻译服务。',
      actions: [
        {
          label: '前往配置',
          primary: true,
          handler: () => {
            this.scrollToProviderConfig('youdao');
          }
        },
        {
          label: '关闭',
          handler: () => {
            this.dismissSuggestion(suggestionId);
          }
        }
      ],
      dismissible: true,
      onDismiss: () => {
        this.dismissSuggestion(suggestionId);
      }
    });

    // 在语音合成区域显示警告
    const speechSection = document.querySelector('#speech-synthesis-section');
    if (speechSection) {
      this.currentSuggestion.show(speechSection as HTMLElement);
    } else {
      this.currentSuggestion.show();
    }
  }

  /**
   * 滚动到指定提供商配置区域
   */
  private scrollToProviderConfig(providerId: string): void {
    const providerCard = document.querySelector(`[data-provider="${providerId}"]`);
    
    if (providerCard) {
      // 滚动到目标位置
      providerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 高亮显示
      providerCard.classList.add('highlight-provider');
      
      // 3秒后移除高亮
      setTimeout(() => {
        providerCard.classList.remove('highlight-provider');
      }, 3000);
    } else {
      console.warn(`[AutoSaveManager] 找不到提供商配置: ${providerId}`);
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    if (this.floatingButton) {
      this.floatingButton.destroy();
      this.floatingButton = null;
    }

    if (this.currentSuggestion) {
      this.currentSuggestion.destroy();
      this.currentSuggestion = null;
    }

    toast.hideAll();
    this.settings = null;
    this.dismissedSuggestions.clear();
  }
}
