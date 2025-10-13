import { vi } from 'vitest';
import { HoverBox } from '../src/content/hover-box.js';
import * as utils from '../src/shared/utils.js';

describe('HoverBox', () => {
  let hoverBox;
  let mockRange;

  beforeEach(() => {
    // 重置 DOM
    document.body.innerHTML = '';
    
    // 创建 HoverBox 实例
    hoverBox = new HoverBox();
    
    // 模拟 Range 对象
    mockRange = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 10,
        right: 110,
        bottom: 30,
        width: 100,
        height: 20
      })
    };
  });

  afterEach(() => {
    hoverBox.destroy();
  });

  describe('创建和销毁', () => {
    test('应该创建悬浮框', () => {
      hoverBox.create();
      
      expect(hoverBox.box).toBeTruthy();
      expect(hoverBox.box.className).toBe('hover-translation-box');
      expect(document.body.contains(hoverBox.box)).toBe(true);
    });

    test('应该避免重复创建', () => {
      hoverBox.create();
      const firstBox = hoverBox.box;
      hoverBox.create();
      
      expect(hoverBox.box).toBe(firstBox);
    });

    test('应该销毁悬浮框', () => {
      hoverBox.create();
      hoverBox.destroy();
      
      expect(hoverBox.box).toBeNull();
      expect(hoverBox.isVisible).toBe(false);
    });
  });

  describe('显示和隐藏', () => {
    beforeEach(() => {
      hoverBox.create();
    });

    test('应该显示翻译结果', () => {
      const translationData = {
        original: 'Hello World',
        translated: '你好世界',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.setSelectionRange(mockRange);
      hoverBox.show(translationData);
      
      expect(hoverBox.isVisible).toBe(true);
      expect(hoverBox.box.classList.contains('show')).toBe(true);
    });

    test('应该更新内容', () => {
      const translationData = {
        original: 'Hello World',
        translated: '你好世界',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      const originalText = hoverBox.box.querySelector('.text-content.original');
      const translatedText = hoverBox.box.querySelector('.text-content.translated');
      const sourceLang = hoverBox.box.querySelector('.source-lang');
      const targetLang = hoverBox.box.querySelector('.target-lang');
      
      expect(originalText.textContent).toBe('Hello World');
      expect(translatedText.textContent).toBe('你好世界');
      expect(sourceLang.textContent).toBe('EN');
      expect(targetLang.textContent).toBe('中文');
    });

    test('应该隐藏悬浮框', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      hoverBox.hide();
      
      expect(hoverBox.isVisible).toBe(false);
      expect(hoverBox.box.classList.contains('show')).toBe(false);
    });

    test('应该处理空数据', () => {
      const translationData = {
        original: '',
        translated: '',
        sourceLang: '',
        targetLang: '',
        provider: ''
      };
      
      hoverBox.show(translationData);
      
      const originalText = hoverBox.box.querySelector('.text-content.original');
      const translatedText = hoverBox.box.querySelector('.text-content.translated');
      
      expect(originalText.textContent).toBe('');
      expect(translatedText.textContent).toBe('');
    });
  });

  describe('定位', () => {
    beforeEach(() => {
      hoverBox.create();
      hoverBox.setSelectionRange(mockRange);
    });

    test('应该计算位置', () => {
      // 模拟视窗大小
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true, configurable: true });
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
      
      hoverBox.positionBox();
      
      // 位置计算会考虑 margin，所以实际位置可能会有调整
      expect(parseInt(hoverBox.box.style.left)).toBeGreaterThanOrEqual(10);
      expect(parseInt(hoverBox.box.style.top)).toBe(38); // 30 + 8
    });

    test('应该处理边界情况', () => {
      // 模拟小视窗
      Object.defineProperty(window, 'innerWidth', { value: 200 });
      Object.defineProperty(window, 'innerHeight', { value: 200 });
      Object.defineProperty(window, 'scrollX', { value: 0 });
      Object.defineProperty(window, 'scrollY', { value: 0 });
      
      hoverBox.positionBox();
      
      // 应该调整到视窗内
      expect(parseInt(hoverBox.box.style.left)).toBeLessThanOrEqual(200);
      expect(parseInt(hoverBox.box.style.top)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('加载状态', () => {
    beforeEach(() => {
      hoverBox.create();
    });

    test('应该显示加载状态', () => {
      hoverBox.showLoading();
      
      const loadingIndicator = hoverBox.box.querySelector('.loading-indicator');
      const providerInfo = hoverBox.box.querySelector('.provider-info');
      
      expect(loadingIndicator.style.display).toBe('flex');
      expect(providerInfo.style.display).toBe('none');
    });

    test('应该隐藏加载状态', () => {
      hoverBox.showLoading();
      hoverBox.hideLoading();
      
      const loadingIndicator = hoverBox.box.querySelector('.loading-indicator');
      const providerInfo = hoverBox.box.querySelector('.provider-info');
      
      expect(loadingIndicator.style.display).toBe('none');
      expect(providerInfo.style.display).toBe('block');
    });
  });

  describe('事件处理', () => {
    beforeEach(() => {
      hoverBox.create();
    });

    test('应该处理复制按钮点击', async () => {
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      const copyBtn = hoverBox.box.querySelector('.copy-btn');
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      
      copyBtn.click();
      
      expect(writeTextSpy).toHaveBeenCalledWith('你好');
    });

    test('应该处理关闭按钮点击', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      
      const closeBtn = hoverBox.box.querySelector('.close-btn');
      closeBtn.click();
      
      expect(hoverBox.isVisible).toBe(false);
    });

    test('应该处理点击外部关闭', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        target: outsideElement
      });
      
      document.dispatchEvent(clickEvent);
      
      expect(hoverBox.isVisible).toBe(false);
      
      document.body.removeChild(outsideElement);
    });

    test('应该处理 ESC 键关闭', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(keyEvent);
      
      expect(hoverBox.isVisible).toBe(false);
    });
  });

  describe('语音播放', () => {
    beforeEach(() => {
      hoverBox.create();
      hoverBox.setSelectionRange(mockRange);
    });

    afterEach(() => {
      delete window.speechSynthesis;
      delete window.SpeechSynthesisUtterance;
    });

    test('不支持语音时给出提示', () => {
      const showNotificationSpy = vi.spyOn(utils, 'showNotification');
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };

      hoverBox.show(translationData);
      const soundBtn = hoverBox.box.querySelector('.sound-btn');
      soundBtn.click();

      expect(showNotificationSpy).toHaveBeenCalledWith('当前浏览器不支持语音朗读', 'warning');
      showNotificationSpy.mockRestore();
    });

    test('支持语音时会播放文本', () => {
      const showNotificationSpy = vi.spyOn(utils, 'showNotification');
      const cancelMock = vi.fn();
      const speakMock = vi.fn((utterance) => {
        if (utterance.onstart) utterance.onstart();
        if (utterance.onend) utterance.onend();
      });

      const fakeVoice = { name: 'Google US English', lang: 'en-US', localService: true };
      window.speechSynthesis = {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: () => [fakeVoice]
      };
      window.SpeechSynthesisUtterance = function(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.pitch = 1;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
      };

      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google',
        detectedSourceLanguage: 'en'
      };

      hoverBox.show(translationData);
      const soundBtn = hoverBox.box.querySelector('.sound-btn');
      soundBtn.click();

      expect(cancelMock).toHaveBeenCalled();
      expect(speakMock).toHaveBeenCalledTimes(1);
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe('Hello');
      expect(utterance.lang).toBe('en-US');
      expect(utterance.voice).toEqual(fakeVoice);
      expect(utterance.rate).toBeCloseTo(0.95);
      expect(utterance.pitch).toBeCloseTo(1.05);
      expect(soundBtn.getAttribute('aria-pressed')).toBe('false');
      expect(showNotificationSpy).not.toHaveBeenCalled();
      showNotificationSpy.mockRestore();
    });

    test('英语单词展示英美发音', async () => {
      const cancelMock = vi.fn();
      const speakMock = vi.fn((utterance) => {
        if (utterance.onstart) utterance.onstart();
        if (utterance.onend) utterance.onend();
      });

      window.speechSynthesis = {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: () => []
      };

      window.SpeechSynthesisUtterance = function(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1;
        this.pitch = 1;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
      };

      const playMock = vi.fn(() => Promise.resolve());
      class FakeAudio {
        constructor(src) {
          this.src = src;
          this.currentTime = 0;
          this.paused = true;
          this.onended = null;
          this.onerror = null;
        }
        play() {
          this.paused = false;
          return playMock();
        }
        pause() {
          this.paused = true;
        }
      }
      const originalAudio = window.Audio;
      window.Audio = FakeAudio;

      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google',
        detectedSourceLanguage: 'en'
      };

      await hoverBox.fetchPronunciation('hello');
      hoverBox.show(translationData);
      await Promise.resolve();
      await Promise.resolve();

      const pronunciationItems = hoverBox.box.querySelectorAll('.pronunciation-item');
      expect(pronunciationItems.length).toBeGreaterThan(0);

      const ukBtn = hoverBox.box.querySelector('.pronounce-btn[data-accent="uk"]');
      expect(ukBtn).toBeTruthy();
      await hoverBox.handleAccentPronounce('uk', 'Hello', ukBtn);

      if (playMock.mock.calls.length) {
        const audioUk = hoverBox.audioPlayers.uk;
        expect(audioUk).toBeTruthy();
        audioUk.onended?.();
      } else {
        expect(speakMock).toHaveBeenCalled();
      }

      expect(ukBtn.classList.contains('is-speaking')).toBe(false);

      const ipaText = hoverBox.box.querySelector('.pronunciation-item[data-accent="uk"] .ipa-text');
      expect(ipaText.textContent).not.toEqual('---');

      window.Audio = originalAudio;
    });
  });

  describe('复制功能', () => {
    beforeEach(() => {
      hoverBox.create();
    });

    test('应该复制翻译结果', async () => {
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockResolvedValue();
      
      await hoverBox.copyToClipboard();
      
      expect(writeTextSpy).toHaveBeenCalledWith('你好');
    });

    test('应该处理复制失败', async () => {
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockRejectedValue(new Error('Copy failed'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      await hoverBox.copyToClipboard();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('复制失败:', expect.any(Error));
    });

    test('应该显示复制成功状态', async () => {
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockResolvedValue();
      
      await hoverBox.copyToClipboard();
      
      const copyBtn = hoverBox.box.querySelector('.copy-btn');
      expect(copyBtn.style.color).toBe('rgb(72, 187, 120)');
    });
  });

  describe('语言名称', () => {
    test('应该正确显示语言名称', () => {
      const testCases = [
        { code: 'zh-CN', expected: '中文' },
        { code: 'en', expected: 'English' },
        { code: 'ja', expected: '日本語' },
        { code: 'unknown', expected: 'UNKNOWN' }
      ];
      
      testCases.forEach(({ code, expected }) => {
      expect(utils.getLanguageName(code)).toBe(expected);
      });
    });
  });
});
