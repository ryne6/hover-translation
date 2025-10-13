import { TextSelector } from './text-selector.js';
import { HoverBox } from './hover-box.js';
import { LanguageDetector } from '../shared/language-detector.js';
import { StorageManager } from '../shared/storage.js';
import { EVENTS } from '../shared/constants.js';

/**
 * 悬停翻译主控制器（新版）
 * 集成多翻译引擎系统
 */
class HoverTranslation {
  constructor() {
    this.textSelector = new TextSelector();
    this.hoverBox = new HoverBox();
    this.languageDetector = new LanguageDetector();
    this.storageManager = new StorageManager();
    this.settings = null;
    this.isEnabled = true;

    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    try {
      // 加载设置
      await this.loadSettings();

      // 初始化组件
      this.textSelector.init();
      this.hoverBox.create();

      // 绑定事件
      this.bindEvents();

      console.log('HoverTranslation initialized (New Translation System)');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    this.settings = await this.storageManager.getSettings();
    console.log('Settings loaded:', this.settings);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 文字选择事件
    document.addEventListener(EVENTS.TEXT_SELECTED, (event) => {
      this.handleTextSelection(event.detail);
    });

    // 选择清除事件
    document.addEventListener(EVENTS.SELECTION_CLEARED, () => {
      this.handleSelectionCleared();
    });

    // 设置更新事件
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          this.loadSettings();
        }
      });
    }
  }

  /**
   * 处理文字选择
   * @param {Object} detail - 选择详情
   */
  async handleTextSelection(detail) {
    if (!this.isEnabled) return;

    const { text, range } = detail;

    // 设置选择范围
    this.hoverBox.setSelectionRange(range);

    // 检测语言
    const detectedLang = this.languageDetector.detectLanguage(text);
    const sourceLang = detectedLang === 'auto' ? this.settings.sourceLanguage : detectedLang;
    const targetLang = this.settings.targetLanguage;

    // 检查是否需要翻译
    if (sourceLang === targetLang) {
      console.log('源语言和目标语言相同，跳过翻译');
      return;
    }

    // 显示加载状态
    this.hoverBox.showLoading();
    this.hoverBox.show({
      original: text,
      translated: '翻译中...',
      sourceLang: sourceLang,
      targetLang: targetLang,
      provider: this.settings.primaryProvider || 'Google',
    });

    try {
      // 调用后台服务进行翻译
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        sourceLang: sourceLang,
        targetLang: targetLang,
      });

      if (response.success) {
        const result = response.data;

        // 显示翻译结果
        this.hoverBox.show({
          original: text,
          translated: result.translatedText,
          sourceLang: result.detectedSourceLanguage || sourceLang,
          targetLang: targetLang,
          provider: result.provider,
        });

        // 保存翻译记录
        await chrome.runtime.sendMessage({
          action: 'saveTranslation',
          original: text,
          translated: result.translatedText,
          sourceLang: result.detectedSourceLanguage || sourceLang,
          targetLang: targetLang,
        });
      } else {
        this.showTranslationError(text, response.error);
      }
    } catch (error) {
      console.error('翻译失败:', error);
      this.showTranslationError(text, error.message);
    } finally {
      this.hoverBox.hideLoading();
    }
  }

  /**
   * 处理选择清除
   */
  handleSelectionCleared() {
    this.hoverBox.hide();
  }

  /**
   * 显示翻译错误
   * @param {string} text - 原文
   * @param {string} errorMessage - 错误消息
   */
  showTranslationError(text, errorMessage) {
    this.hoverBox.show({
      original: text,
      translated: `翻译失败: ${errorMessage}`,
      sourceLang: 'auto',
      targetLang: this.settings.targetLanguage,
      provider: '错误',
    });
  }

  /**
   * 启用/禁用翻译
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.hoverBox.hide();
    }
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.textSelector.destroy();
    this.hoverBox.destroy();
    console.log('HoverTranslation destroyed');
  }
}

// 创建全局实例
let hoverTranslation = null;

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hoverTranslation = new HoverTranslation();
  });
} else {
  hoverTranslation = new HoverTranslation();
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (hoverTranslation) {
    hoverTranslation.destroy();
  }
});

// 导出给其他模块使用
window.hoverTranslation = hoverTranslation;
