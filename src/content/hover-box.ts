/* eslint-disable @typescript-eslint/ban-ts-comment */
import { calculateOptimalPosition, copyToClipboard as copyTextToClipboard, getLanguageName, showNotification } from '../shared/utils';
import type { ViewportRect } from '../shared/utils';

export interface HoverBoxTranslationData {
  original: string;
  translated: string;
  sourceLang?: string;
  targetLang?: string;
  provider?: string;
  detectedSourceLanguage?: string;
}

interface HoverBoxPosition {
  x: number;
  y: number;
}

interface PronunciationEntry {
  accent: string;
  ipa: string;
  audioUrl: string;
}

interface PronunciationInfo {
  entries: PronunciationEntry[];
  defaultAccent: string;
}

interface SpeechOptions {
  button?: HTMLButtonElement | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error?: unknown) => void;
}

const ACCENT_CONFIG = {
  us: { label: '美式', locale: 'en-US' },
  uk: { label: '英式', locale: 'en-GB' },
  default: { label: '标准', locale: 'en-US' },
} as const;

type AccentId = keyof typeof ACCENT_CONFIG;

const FALLBACK_PRONUNCIATIONS: Record<
  string,
  { entries: Array<{ accent: AccentId; ipa: string; audioUrl: string }>; defaultAccent: AccentId }
> = {
  hello: {
    entries: [
      { accent: 'us', ipa: 'həˈloʊ', audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_us_1.mp3' },
      { accent: 'uk', ipa: 'həˈləʊ', audioUrl: 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_gb_1.mp3' },
    ],
    defaultAccent: 'us',
  },
};

const PRONUNCIATION_LOADING_HTML = '<div class="pronunciation-loading">正在加载音标...</div>';
const COPY_SUCCESS_COLOR = '#48bb78';
const DEFAULT_TRANSLATION: HoverBoxTranslationData = {
  original: '',
  translated: '',
  sourceLang: 'AUTO',
  targetLang: 'zh-CN',
  provider: 'Google'
};

const getAccentConfig = (accent: string) => ACCENT_CONFIG[accent as AccentId] ?? ACCENT_CONFIG.default;

export class HoverBox {
  private box: HTMLDivElement | null;

  private isVisible: boolean;

  private position: HoverBoxPosition;

  private currentRange: Range | null;

  private animationDuration: number;

  private currentTranslation: HoverBoxTranslationData | null;

  private currentUtterance: SpeechSynthesisUtterance | null;

  private pronunciationCache: Map<string, PronunciationInfo>;

  private pronunciationRequestToken: symbol | null;

  private pronunciationButtons: Map<string, HTMLButtonElement>;

  private audioPlayers: Record<string, HTMLAudioElement>;

  private copyResetTimer: ReturnType<typeof setTimeout> | null;

  private originalTextEl: HTMLElement | null;

  private translatedTextEl: HTMLElement | null;

  private sourceLangEl: HTMLElement | null;

  private targetLangEl: HTMLElement | null;

  private providerEl: HTMLElement | null;

  private loadingIndicatorEl: HTMLElement | null;

  private pronunciationSectionEl: HTMLElement | null;

  private pronunciationContentEl: HTMLElement | null;

  private copyBtn: HTMLButtonElement | null;

  private closeBtn: HTMLButtonElement | null;

  private soundBtn: HTMLButtonElement | null;

  constructor() {
    this.box = null;
    this.isVisible = false;
    this.position = { x: 0, y: 0 };
    this.currentRange = null;
    this.animationDuration = 200;
    this.currentTranslation = null;
    this.currentUtterance = null;
    this.pronunciationCache = new Map();
    this.pronunciationRequestToken = null;
    this.pronunciationButtons = new Map();
    this.audioPlayers = {};
    this.copyResetTimer = null;
    this.originalTextEl = null;
    this.translatedTextEl = null;
    this.sourceLangEl = null;
    this.targetLangEl = null;
    this.providerEl = null;
    this.loadingIndicatorEl = null;
    this.pronunciationSectionEl = null;
    this.pronunciationContentEl = null;
    this.copyBtn = null;
    this.closeBtn = null;
    this.soundBtn = null;

  }

  create(): void {
    if (this.box) return;

    this.box = document.createElement('div');
    this.box.className = 'hover-translation-box';
    this.box.innerHTML = this.getTemplate();
    this.box.style.display = 'none';
    document.body.appendChild(this.box);

    this.cacheInnerElements();
    this.addEventListeners();
    console.log('HoverBox created');
  }

  cacheInnerElements(): void {
    if (!this.box) return;

    this.originalTextEl = this.box.querySelector('.text-content.original');
    this.translatedTextEl = this.box.querySelector('.text-content.translated');
    this.sourceLangEl = this.box.querySelector('.source-lang');
    this.targetLangEl = this.box.querySelector('.target-lang');
    this.providerEl = this.box.querySelector('.provider-info');
    this.loadingIndicatorEl = this.box.querySelector('.loading-indicator');
    this.pronunciationSectionEl = this.box.querySelector('.pronunciation-section');
    this.pronunciationContentEl = this.box.querySelector('.pronunciation-content');
    this.copyBtn = this.box.querySelector('.copy-btn');
    this.closeBtn = this.box.querySelector('.close-btn');
    this.soundBtn = this.box.querySelector('.sound-btn');
  }

  getTemplate(): string {
    return `
      <div class="translation-header">
        <div class="language-indicator">
          <span class="source-lang">EN</span>
          <div class="arrow-icon">→</div>
          <span class="target-lang">中文</span>
        </div>
        <div class="action-buttons">
          <button class="btn-icon sound-btn" title="朗读原文" aria-label="朗读原文" aria-pressed="false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 10v4h3l4 4V6L6 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <button class="btn-icon copy-btn" title="复制翻译" aria-label="复制翻译结果">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
          <button class="btn-icon close-btn" title="关闭" aria-label="关闭翻译框">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="translation-content">
        <div class="original-text">
          <span class="text-label">原文</span>
          <p class="text-content original"></p>
        </div>
        <div class="pronunciation-section" style="display: none;">
          <div class="pronunciation-content"></div>
        </div>
        <div class="translated-text">
          <span class="text-label">译文</span>
          <p class="text-content translated"></p>
        </div>
      </div>
      <div class="translation-footer">
        <div class="provider-info">由 Google 翻译提供</div>
        <div class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span>翻译中...</span>
        </div>
      </div>
    `;
  }

  addEventListeners(): void {
    if (!this.box) return;

    this.copyBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.copyToClipboard();
    });

    this.closeBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.hide();
    });

    this.soundBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.handleSoundButtonClick();
    });

    document.addEventListener('click', this.handleDocumentClick, true);
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleResize, true);
  }

  removeEventListeners(): void {
    document.removeEventListener('click', this.handleDocumentClick, true);
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleResize, true);
  }

  private readonly handleResize = (): void => {
    if (!this.isVisible) return;
    this.positionBox();
  };

  setSelectionRange(range: Range | null): void {
    this.currentRange = range || null;
  }

  show(translationData: HoverBoxTranslationData): void {
    if (!this.box) this.create();
    if (!this.box) return;

    this.currentTranslation = translationData;
    this.pronunciationRequestToken = null;

    this.stopSpeaking();

    this.box.style.visibility = 'hidden';
    this.box.style.display = 'block';

    this.updateContent(translationData);
    this.positionBox();
    this.renderPronunciation(translationData);

    this.box.style.visibility = '';
    this.box.classList.add('show');
    this.isVisible = true;
  }

  hide(): void {
    if (!this.box || !this.isVisible) return;

    this.stopSpeaking();
    this.box.classList.remove('show');
    this.box.style.display = 'none';
    this.isVisible = false;
  }

  updateContent(data: HoverBoxTranslationData = DEFAULT_TRANSLATION): void {
    if (!this.box) return;

    const original = data.original ?? '';
    const translated = data.translated ?? '';
    const sourceLang = (data.sourceLang || data.detectedSourceLanguage || 'AUTO').toUpperCase();
    const targetLang = data.targetLang ?? 'zh-CN';
    const provider = data.provider ?? 'Google';

    if (this.originalTextEl) this.originalTextEl.textContent = original;
    if (this.translatedTextEl) this.translatedTextEl.textContent = translated;
    if (this.sourceLangEl) this.sourceLangEl.textContent = sourceLang;
    if (this.targetLangEl) this.targetLangEl.textContent = getLanguageName(targetLang);
    if (this.providerEl) this.providerEl.textContent = `由 ${provider} 提供`;
  }

  positionBox(): void {
    if (!this.box || !this.currentRange) return;

    let selectionRect: DOMRect;
    try {
      selectionRect = this.currentRange.getBoundingClientRect();
    } catch (error) {
      console.error('获取选区位置失败:', error);
      return;
    }

    const boxRect = this.box.getBoundingClientRect();
    const viewport: ViewportRect = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const optimalPosition = calculateOptimalPosition(selectionRect, boxRect, viewport);

    this.position = { x: optimalPosition.x, y: optimalPosition.y };
    this.box.style.left = `${optimalPosition.x}px`;
    this.box.style.top = `${optimalPosition.y}px`;
  }

  showLoading(): void {
    if (!this.box) return;
    if (this.loadingIndicatorEl) {
      this.loadingIndicatorEl.style.display = 'flex';
    }
    if (this.providerEl) {
      this.providerEl.style.display = 'none';
    }
  }

  hideLoading(): void {
    if (!this.box) return;
    if (this.loadingIndicatorEl) {
      this.loadingIndicatorEl.style.display = 'none';
    }
    if (this.providerEl) {
      this.providerEl.style.display = 'block';
    }
  }

  async copyToClipboard(): Promise<void> {
    if (!this.box) return;
    const text = this.translatedTextEl?.textContent || '';
    const success = await copyTextToClipboard(text);
    if (success) {
      this.showCopySuccess();
    }
  }

  showCopySuccess(): void {
    if (!this.copyBtn) return;

    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }

    this.copyBtn.style.color = COPY_SUCCESS_COLOR;
    this.copyResetTimer = setTimeout(() => {
      if (this.copyBtn) {
        this.copyBtn.style.color = '';
      }
    }, 2000);
  }

  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (!this.isVisible || !this.box) return;

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(this.box)) {
      return;
    }

    const isNodeAvailable = typeof Node === 'function';
    if (isNodeAvailable && event.target instanceof Node && this.box.contains(event.target)) {
      return;
    }

    this.hide();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.hide();
    }
  };

  destroy(): void {
    this.stopSpeaking();
    this.removeEventListeners();

    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
      this.copyResetTimer = null;
    }

    if (this.box?.parentNode) {
      this.box.parentNode.removeChild(this.box);
    }

    this.box = null;
    this.isVisible = false;
    this.currentRange = null;
    this.pronunciationButtons.clear();
    this.audioPlayers = {};
    console.log('HoverBox destroyed');
  }

  async renderPronunciation(data: HoverBoxTranslationData | null | undefined): Promise<void> {
    if (!this.box || !this.pronunciationSectionEl || !this.pronunciationContentEl) return;

    const sectionEl = this.pronunciationSectionEl;
    const contentEl = this.pronunciationContentEl;

    this.pronunciationButtons.clear();
    sectionEl.style.display = 'none';
    contentEl.innerHTML = '';
    this.pronunciationRequestToken = null;

    const sourceLang = (data?.detectedSourceLanguage || data?.sourceLang || '').toLowerCase();
    const original = (data?.original || '').trim();

    if (sourceLang !== 'en' || !original || original.split(/\s+/).length !== 1) {
      return;
    }

    const normalized = original.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!normalized) return;

    sectionEl.style.display = 'block';
    contentEl.innerHTML = PRONUNCIATION_LOADING_HTML;

    const requestId = Symbol('pronunciation');
    this.pronunciationRequestToken = requestId;

    try {
      const info = await this.fetchPronunciation(normalized);
      if (this.pronunciationRequestToken !== requestId) return;
      this.pronunciationRequestToken = null;

      if (!info || !Array.isArray(info.entries) || info.entries.length === 0) {
        sectionEl.style.display = 'none';
        contentEl.innerHTML = '';
        return;
      }

      contentEl.innerHTML = '';
      info.entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'pronunciation-item';
        item.dataset.accent = entry.accent;

        const pronounceBtn = document.createElement('button');
        pronounceBtn.type = 'button';
        pronounceBtn.className = 'pronounce-btn';
        pronounceBtn.dataset.accent = entry.accent;
        pronounceBtn.setAttribute('aria-label', `播放${this.getAccentLabel(entry.accent)}发音`);
        pronounceBtn.setAttribute('aria-pressed', 'false');
        pronounceBtn.textContent = this.getAccentLabel(entry.accent);

        pronounceBtn.addEventListener('click', () => {
          this.handleAccentPronounce(entry.accent, normalized, pronounceBtn);
        });

        const ipaSpan = document.createElement('span');
        ipaSpan.className = 'ipa-text';
        ipaSpan.textContent = entry.ipa || '---';

        item.appendChild(pronounceBtn);
        item.appendChild(ipaSpan);
        contentEl.appendChild(item);
        this.pronunciationButtons.set(entry.accent, pronounceBtn);
      });
    } catch (error) {
      console.error('获取发音失败:', error);
      if (this.pronunciationRequestToken !== requestId) return;
      this.pronunciationRequestToken = null;
      sectionEl.style.display = 'none';
      contentEl.innerHTML = '';
    }
  }

  async handleAccentPronounce(accent: string, word: string, button?: HTMLButtonElement | null): Promise<void> {
    const normalized = word.toLowerCase();
    if (!normalized) return;

    const info = await this.fetchPronunciation(normalized);
    if (!info.entries || info.entries.length === 0) {
      showNotification('暂无可用的发音音频', 'warning');
      return;
    }

    const targetEntry =
      info.entries.find((entry) => entry.accent === accent) ||
      info.entries.find((entry) => entry.accent === info.defaultAccent) ||
      info.entries[0];

    if (!targetEntry) {
      showNotification('暂无可用的发音音频', 'warning');
      return;
    }

    this.stopPronunciationAudio();
    this.setButtonSpeaking(button || this.pronunciationButtons.get(accent), true);

    const finish = () => {
      this.setButtonSpeaking(button || this.pronunciationButtons.get(accent), false);
      delete this.audioPlayers[accent];
    };

    const fallback = () => {
      const { locale } = getAccentConfig(accent);
      this.speakWithSpeechSynthesis(locale, word, {
        button: button || this.pronunciationButtons.get(accent),
        onEnd: finish,
        onError: finish,
      });
    };

    if (targetEntry.audioUrl && typeof Audio === 'function') {
      try {
        const audio = new Audio(targetEntry.audioUrl);
        audio.crossOrigin = 'anonymous';
        audio.onended = finish;
        audio.onerror = (event) => {
          const message =
            event instanceof ErrorEvent
              ? event.message
              : typeof event === 'string'
                ? event
                : (event as Event).type;
          console.warn('音频播放失败:', message);
          finish();
          fallback();
        };
        this.audioPlayers[accent] = audio;
        const playResult = audio.play();
        if (playResult && typeof playResult.then === 'function') {
          playResult.catch((error: unknown) => {
            console.warn('音频播放失败:', error);
            finish();
            fallback();
          });
        }
        return;
      } catch (error) {
        console.warn('音频播放失败:', error);
      }
    }

    fallback();
  }

  stopPronunciationAudio(): void {
    Object.keys(this.audioPlayers).forEach((accent) => {
      const player = this.audioPlayers[accent];
      if (!player) {
        return;
      }

      try {
        player.pause();
      } catch (error) {
        console.warn('暂停音频失败:', error);
      }

      try {
        player.currentTime = 0;
      } catch (error) {
        // ignore reset errors
      }

      delete this.audioPlayers[accent];
    });

    this.pronunciationButtons.forEach((btn) => this.setButtonSpeaking(btn, false));
  }

  handleSoundButtonClick(): void {
    if (!this.soundBtn) return;

    if (this.soundBtn.getAttribute('aria-pressed') === 'true') {
      this.stopSpeaking();
      return;
    }

    const text = this.currentTranslation?.original?.trim();
    if (!text) {
      showNotification('暂无可朗读的文本', 'warning');
      return;
    }

    if (!this.isSpeechSynthesisSupported()) {
      showNotification('当前浏览器不支持语音朗读', 'warning');
      return;
    }

    this.stopSpeaking();

    const lang = (this.currentTranslation?.detectedSourceLanguage || this.currentTranslation?.sourceLang || 'en').toLowerCase();
    const locale = this.mapLanguageToLocale(lang);
    this.speakWithSpeechSynthesis(locale, text, { button: this.soundBtn });
  }

  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  }

  speakWithSpeechSynthesis(locale: string, text: string, options: SpeechOptions = {}): void {
    if (!text) {
      options.onError?.();
      return;
    }

    if (!this.isSpeechSynthesisSupported()) {
      showNotification('当前浏览器不支持语音朗读', 'warning');
      options.onError?.();
      return;
    }

    const { button, onStart, onEnd, onError } = options;
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;

    this.stopSpeechSynthesis();

    const utterance = new Utterance(text);
    this.currentUtterance = utterance;

    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const selectedVoice = this.pickVoice(voices, locale);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || locale;
    } else {
      utterance.lang = locale;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      if (button) {
        this.setButtonSpeaking(button, true);
      }
      onStart?.();
    };

    utterance.onend = () => {
      if (button) {
        this.setButtonSpeaking(button, false);
      }
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.warn('语音播放失败:', event?.error || event);
      if (button) {
        this.setButtonSpeaking(button, false);
      }
      this.currentUtterance = null;
      onError?.(event);
    };

    try {
      synth.speak(utterance);
    } catch (error) {
      console.warn('语音播放失败:', error);
      if (button) {
        this.setButtonSpeaking(button, false);
      }
      this.currentUtterance = null;
      onError?.(error);
    }
  }

  pickVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | null {
    if (!Array.isArray(voices) || voices.length === 0) return null;
    const exact = voices.find((voice) => voice.lang === locale);
    if (exact) return exact;

    const base = locale.split('-')[0];
    const partial = voices.find((voice) => voice.lang && voice.lang.startsWith(base));
    if (partial) return partial;

    return voices[0];
  }

  stopSpeaking(): void {
    this.stopPronunciationAudio();
    this.stopSpeechSynthesis();
  }

  stopSpeechSynthesis(): void {
    if (!this.isSpeechSynthesisSupported()) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.warn('停止语音失败:', error);
    }

    if (this.soundBtn) {
      this.setButtonSpeaking(this.soundBtn, false);
    }
    this.currentUtterance = null;
  }

  setButtonSpeaking(button: HTMLButtonElement | null | undefined, isSpeaking: boolean): void {
    if (!button) return;
    button.classList.toggle('is-speaking', Boolean(isSpeaking));
    button.setAttribute('aria-pressed', isSpeaking ? 'true' : 'false');
  }

  mapLanguageToLocale(lang: string): string {
    if (!lang) return 'en-US';
    const normalized = lang.toLowerCase();
    if (normalized === 'en' || normalized === 'en-us') return 'en-US';
    if (normalized === 'en-gb' || normalized === 'uk') return 'en-GB';
    if (normalized === 'zh' || normalized === 'zh-cn') return 'zh-CN';
    if (normalized === 'zh-tw') return 'zh-TW';
    if (normalized === 'ja') return 'ja-JP';
    if (normalized === 'ko') return 'ko-KR';
    if (normalized === 'fr') return 'fr-FR';
    if (normalized === 'de') return 'de-DE';
    if (normalized === 'es') return 'es-ES';
    if (normalized === 'ru') return 'ru-RU';
    if (normalized === 'it') return 'it-IT';
    if (normalized === 'pt') return 'pt-PT';
    if (normalized === 'ar') return 'ar-SA';
    if (normalized === 'hi') return 'hi-IN';
    if (normalized.includes('-')) return normalized;
    return `${normalized}-${normalized.toUpperCase()}`;
  }

  async fetchPronunciation(word: string): Promise<PronunciationInfo> {
    const cacheKey = word.toLowerCase();
    const cached = this.pronunciationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let parsed: PronunciationInfo | null = null;
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cacheKey)}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        parsed = this.parsePronunciationResponse(data);
      } else {
        throw new Error(`Dictionary request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('远程获取发音失败，尝试使用本地数据:', error);
    }

    if (!parsed || !Array.isArray(parsed.entries) || parsed.entries.length === 0) {
      parsed = this.getFallbackPronunciation(cacheKey);
    }

    if (!parsed) {
      parsed = { entries: [], defaultAccent: 'default' };
    }

    this.pronunciationCache.set(cacheKey, parsed);
    return parsed;
  }

  parsePronunciationResponse(data: unknown): PronunciationInfo | null {
    if (!Array.isArray(data)) {
      return null;
    }

    const entries: PronunciationEntry[] = [];

    data.forEach((entry) => {
      if (!entry || typeof entry !== 'object') {
        return;
      }

      const phonetics = (entry as { phonetics?: unknown }).phonetics;
      if (!Array.isArray(phonetics)) {
        return;
      }

      phonetics.forEach((phonetic) => {
        if (!phonetic || typeof phonetic !== 'object') {
          return;
        }

        const record = phonetic as { text?: unknown; audio?: unknown };
        const ipa = typeof record.text === 'string' ? record.text : '';
        const audioUrl = typeof record.audio === 'string' ? record.audio : '';
        if (!ipa && !audioUrl) {
          return;
        }

        const accent = this.detectAccent(audioUrl);
        const existing = entries.find((item) => item.accent === accent);
        if (existing) {
          if (!existing.ipa && ipa) existing.ipa = ipa;
          if (!existing.audioUrl && audioUrl) existing.audioUrl = audioUrl;
          return;
        }

        entries.push({ accent, ipa, audioUrl });
      });
    });

    if (entries.length === 0) {
      return null;
    }

    const defaultAccent =
      entries.find((item) => item.accent === 'us')?.accent ||
      entries.find((item) => item.accent === 'uk')?.accent ||
      entries[0].accent;

    return { entries, defaultAccent };
  }

  detectAccent(audioUrl: string = ''): AccentId {
    const url = audioUrl.toLowerCase();
    if (url.includes('_us_') || url.includes('-us-') || url.endsWith('us.mp3')) {
      return 'us';
    }
    if (url.includes('_uk_') || url.includes('-uk-') || url.endsWith('uk.mp3') || url.includes('-gb-')) {
      return 'uk';
    }
    return 'default';
  }

  getAccentLabel(accent: string): string {
    return getAccentConfig(accent).label;
  }

  getFallbackPronunciation(word: string): PronunciationInfo | null {
    const fallback = FALLBACK_PRONUNCIATIONS[word];
    if (!fallback) return null;

    return {
      entries: fallback.entries.map((entry) => ({
        accent: entry.accent,
        ipa: entry.ipa,
        audioUrl: entry.audioUrl
      })),
      defaultAccent: fallback.defaultAccent
    };
  }
}
