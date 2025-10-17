import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { HoverBox } from '../src/content/hover-box';
import * as utils from '../src/shared/utils';
import { getPrivate } from './helpers/private-access';

describe('HoverBox', () => {
  let hoverBox: HoverBox;
  let mockRange: Range;

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
    } as unknown as Range;
  });

  afterEach(() => {
    hoverBox.destroy();
  });

  describe('创建和销毁', () => {
    test('应该创建悬浮框', () => {
      hoverBox.create();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      expect(box).toBeTruthy();
      expect(box?.className).toBe('hover-translation-box');
      expect(box ? document.body.contains(box) : false).toBe(true);
    });

    test('应该避免重复创建', () => {
      hoverBox.create();
      const firstBox = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      hoverBox.create();
      const secondBox = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      expect(secondBox).toBe(firstBox);
    });

    test('应该销毁悬浮框', () => {
      hoverBox.create();
      hoverBox.destroy();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      const isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      
      expect(box).toBeNull();
      expect(isVisible).toBe(false);
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
      const isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      expect(isVisible).toBe(true);
      expect(box?.classList.contains('show')).toBe(true);
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
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      const originalText = box?.querySelector<HTMLElement>('.text-content.original');
      const translatedText = box?.querySelector<HTMLElement>('.text-content.translated');
      const sourceLang = box?.querySelector<HTMLElement>('.source-lang');
      const targetLang = box?.querySelector<HTMLElement>('.target-lang');
      
      expect(originalText?.textContent ?? '').toBe('Hello World');
      expect(translatedText?.textContent ?? '').toBe('你好世界');
      expect(sourceLang?.textContent ?? '').toBe('EN');
      expect(targetLang?.textContent ?? '').toBe('中文');
    });

    test('应该隐藏悬浮框', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      hoverBox.hide();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      const isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      
      expect(isVisible).toBe(false);
      expect(box?.classList.contains('show')).toBe(false);
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
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      const originalText = box?.querySelector('.text-content.original');
      const translatedText = box?.querySelector('.text-content.translated');
      
      expect(originalText?.textContent).toBe('');
      expect(translatedText?.textContent).toBe('');
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
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      // 位置计算会考虑 margin，所以实际位置可能会有调整
      expect(parseInt(box?.style.left ?? '0', 10)).toBeGreaterThanOrEqual(10);
      expect(parseInt(box?.style.top ?? '0', 10)).toBe(38); // 30 + 8
    });

    test('应该处理边界情况', () => {
      // 模拟小视窗
      Object.defineProperty(window, 'innerWidth', { value: 200 });
      Object.defineProperty(window, 'innerHeight', { value: 200 });
      Object.defineProperty(window, 'scrollX', { value: 0 });
      Object.defineProperty(window, 'scrollY', { value: 0 });
      
      hoverBox.positionBox();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      // 应该调整到视窗内
      expect(parseInt(box?.style.left ?? '0', 10)).toBeLessThanOrEqual(200);
      expect(parseInt(box?.style.top ?? '0', 10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('加载状态', () => {
    beforeEach(() => {
      hoverBox.create();
    });

    test('应该显示加载状态', () => {
      hoverBox.showLoading();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      const loadingIndicator = box?.querySelector<HTMLElement>('.loading-indicator');
      const providerInfo = box?.querySelector<HTMLElement>('.provider-info');
      
      expect(loadingIndicator?.style.display).toBe('flex');
      expect(providerInfo?.style.display).toBe('none');
    });

    test('应该隐藏加载状态', () => {
      hoverBox.showLoading();
      hoverBox.hideLoading();
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      const loadingIndicator = box?.querySelector<HTMLElement>('.loading-indicator');
      const providerInfo = box?.querySelector<HTMLElement>('.provider-info');
      
      expect(loadingIndicator?.style.display).toBe('none');
      expect(providerInfo?.style.display).toBe('block');
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
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      
      const copyBtn = box?.querySelector<HTMLButtonElement>('.copy-btn');
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      
      copyBtn?.click();
      
      expect(writeTextSpy).toHaveBeenCalledWith('你好');
    });

    test('应该处理点击外部关闭', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      
      expect(isVisible).toBe(false);
      
      document.body.removeChild(outsideElement);
    });

    test('应该处理 ESC 键关闭', () => {
      hoverBox.show({ original: 'test', translated: '测试' });
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(keyEvent);
      const isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      
      expect(isVisible).toBe(false);
    });

    test('语音播放期间应该禁止关闭悬浮框', () => {
      const translationData = {
        original: 'Hello',
        translated: '你好',
        sourceLang: 'en',
        targetLang: 'zh-CN',
        provider: 'Google'
      };
      
      hoverBox.show(translationData);
      
      // 模拟语音播放开始 - 使用 getPrivate 的反向操作来设置私有属性
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (hoverBox as Record<string, any>)['isSpeechPlaying'] = true;
      
      // 尝试点击外部关闭
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // 悬浮框应该仍然可见
      let isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      expect(isVisible).toBe(true);
      
      // 模拟语音播放结束
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (hoverBox as Record<string, any>)['isSpeechPlaying'] = false;
      
      // 再次尝试点击外部关闭
      outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // 现在悬浮框应该被关闭
      isVisible = getPrivate<boolean>(hoverBox, 'isVisible');
      expect(isVisible).toBe(false);
      
      document.body.removeChild(outsideElement);
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
      
      const box = getPrivate<HTMLDivElement | null>(hoverBox, 'box');
      const copyBtn = box?.querySelector<HTMLButtonElement>('.copy-btn');
      expect(copyBtn?.style.color).toBe('rgb(72, 187, 120)');
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
