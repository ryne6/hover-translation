/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TextSelector } from './text-selector';
import type { SelectionEventDetail } from './text-selector';
import { HoverBox } from './hover-box';
import type { HoverBoxTranslationData } from './hover-box';
import { LanguageDetector } from '../shared/language-detector';
import { StorageManager } from '../shared/storage';
import { EVENTS } from '../shared/constants';
import type { TranslationSettings } from '../shared/config-manager';
import { sendRuntimeMessage } from '../shared/utils';

interface TranslateRequest extends Record<string, unknown> {
  action: 'translate';
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  provider: string;
}

interface TranslateResponse {
  success: boolean;
  data?: TranslateResult;
  error?: string;
}

interface SaveTranslationRequest extends Record<string, unknown> {
  action: 'saveTranslation';
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}

declare global {
  interface Window {
    hoverTranslation: HoverTranslation | null;
  }
}

class HoverTranslation {
  private readonly textSelector: TextSelector;

  private readonly hoverBox: HoverBox;

  private readonly languageDetector: LanguageDetector;

  private readonly storageManager: StorageManager;

  private settings: TranslationSettings | null;

  private isEnabled: boolean;

  private readonly handleTextSelectedListener = (event: Event): void => {
    const customEvent = event as CustomEvent<SelectionEventDetail>;
    if (!customEvent.detail) {
      return;
    }
    void this.handleTextSelection(customEvent.detail);
  };

  private readonly handleSelectionClearedListener = (): void => {
    this.handleSelectionCleared();
  };

  private readonly handleSettingsChangedListener = (_changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
    if (areaName === 'sync') {
      void this.loadSettings();
    }
  };

  constructor() {
    this.textSelector = new TextSelector();
    this.hoverBox = new HoverBox();
    this.languageDetector = new LanguageDetector();
    this.storageManager = new StorageManager();
    this.settings = null;
    this.isEnabled = true;

    void this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.loadSettings();
      this.textSelector.init();
      this.hoverBox.create();
      this.bindEvents();
      console.log('HoverTranslation initialized (New Translation System)');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    this.settings = await this.storageManager.getSettings();
    console.log('Settings loaded:', this.settings);
  }

  private bindEvents(): void {
    document.addEventListener(EVENTS.TEXT_SELECTED, this.handleTextSelectedListener);
    document.addEventListener(EVENTS.SELECTION_CLEARED, this.handleSelectionClearedListener);

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(this.handleSettingsChangedListener);
    }
  }

  private async handleTextSelection(detail: SelectionEventDetail): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const settings = this.settings;
    if (!settings) {
      console.warn('设置尚未加载，跳过翻译');
      return;
    }

    const { text, range } = detail;
    if (!text || !text.trim()) {
      return;
    }

    this.hoverBox.setSelectionRange(range);

    const detectedLang = this.languageDetector.detectLanguage(text);
    const sourceLang = detectedLang === 'auto' ? settings.sourceLanguage : detectedLang;
    const targetLang = settings.targetLanguage;

    if (sourceLang === targetLang) {
      console.log('源语言和目标语言相同，跳过翻译');
      return;
    }

    const provider = settings.primaryProvider || 'Google';

    const loadingState: HoverBoxTranslationData = {
      original: text,
      translated: '翻译中...',
      sourceLang,
      targetLang,
      provider
    };

    this.hoverBox.showLoading();
    this.hoverBox.show(loadingState);

    try {
      const response = await sendRuntimeMessage<TranslateRequest, TranslateResponse>({
        action: 'translate',
        text,
        sourceLang,
        targetLang
      });

      if (!response?.success || !response.data) {
        this.showTranslationError(text, response?.error ?? '未知错误');
        return;
      }

      const result = response.data;
      const resolvedSource = result.detectedSourceLanguage || sourceLang;

      this.hoverBox.show({
        original: text,
        translated: result.translatedText,
        sourceLang: resolvedSource,
        targetLang,
        provider: result.provider || provider,
        detectedSourceLanguage: result.detectedSourceLanguage
      });

      await sendRuntimeMessage<SaveTranslationRequest, unknown>({
        action: 'saveTranslation',
        original: text,
        translated: result.translatedText,
        sourceLang: resolvedSource,
        targetLang
      });
    } catch (error) {
      console.error('翻译失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      this.showTranslationError(text, message);
    } finally {
      this.hoverBox.hideLoading();
    }
  }

  private handleSelectionCleared(): void {
    this.hoverBox.hide();
  }

  private showTranslationError(text: string, errorMessage: string): void {
    const targetLang = this.settings?.targetLanguage ?? 'zh-CN';
    this.hoverBox.show({
      original: text,
      translated: `翻译失败: ${errorMessage}`,
      sourceLang: 'auto',
      targetLang,
      provider: '错误'
    });
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.hoverBox.hide();
    }
  }

  destroy(): void {
    document.removeEventListener(EVENTS.TEXT_SELECTED, this.handleTextSelectedListener);
    document.removeEventListener(EVENTS.SELECTION_CLEARED, this.handleSelectionClearedListener);
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.removeListener(this.handleSettingsChangedListener);
    }
    this.textSelector.destroy();
    this.hoverBox.destroy();
    console.log('HoverTranslation destroyed');
  }
}

let hoverTranslation: HoverTranslation | null = null;
window.hoverTranslation = hoverTranslation;

const bootstrap = (): void => {
  hoverTranslation = new HoverTranslation();
  window.hoverTranslation = hoverTranslation;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

window.addEventListener('beforeunload', () => {
  hoverTranslation?.destroy();
  hoverTranslation = null;
  window.hoverTranslation = null;
});
