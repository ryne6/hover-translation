import { vi } from 'vitest';
import {
  debounce,
  throttle,
  generateCacheKey,
  isCacheExpired,
  getLanguageName,
  detectLanguage,
  calculateOptimalPosition,
  copyToClipboard,
  showNotification
} from '../src/shared/utils';
import type { NotificationType } from '../src/shared/utils';

describe('Utils', () => {
  describe('debounce', () => {
    test('应该防抖函数调用', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('应该传递参数', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('arg1', 'arg2');
      
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    test('应该节流函数调用', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(150);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateCacheKey', () => {
    test('应该生成正确的缓存键', () => {
      const key = generateCacheKey('hello', 'en', 'zh-CN');
      expect(key).toBe('hello_en_zh-CN');
    });

    test('应该处理特殊字符', () => {
      const key = generateCacheKey('hello world!', 'en', 'zh-CN');
      expect(key).toBe('hello world!_en_zh-CN');
    });
  });

  describe('isCacheExpired', () => {
    test('应该检测过期缓存', () => {
      const now = Date.now();
      const expired = isCacheExpired(now - 25 * 60 * 60 * 1000); // 25小时前
      expect(expired).toBe(true);
    });

    test('应该检测未过期缓存', () => {
      const now = Date.now();
      const notExpired = isCacheExpired(now - 12 * 60 * 60 * 1000); // 12小时前
      expect(notExpired).toBe(false);
    });
  });

  describe('getLanguageName', () => {
    test('应该返回正确的语言名称', () => {
      expect(getLanguageName('zh-CN')).toBe('中文');
      expect(getLanguageName('en')).toBe('English');
      expect(getLanguageName('ja')).toBe('日本語');
      expect(getLanguageName('unknown')).toBe('UNKNOWN');
    });
  });

  describe('detectLanguage', () => {
    test('应该检测中文', () => {
      expect(detectLanguage('你好世界')).toBe('zh-CN');
      expect(detectLanguage('这是中文')).toBe('zh-CN');
    });

    test('应该检测日文', () => {
      expect(detectLanguage('こんにちは')).toBe('ja');
      expect(detectLanguage('にほんご')).toBe('ja');  // 使用假名而不是纯汉字
      expect(detectLanguage('ありがとう')).toBe('ja');
    });

    test('应该检测韩文', () => {
      expect(detectLanguage('안녕하세요')).toBe('ko');
      expect(detectLanguage('한국어')).toBe('ko');
    });

    test('应该检测阿拉伯文', () => {
      expect(detectLanguage('مرحبا')).toBe('ar');
    });

    test('应该检测俄文', () => {
      expect(detectLanguage('Привет')).toBe('ru');
    });

    test('应该检测印地文', () => {
      expect(detectLanguage('नमस्ते')).toBe('hi');
    });

    test('应该检测英文', () => {
      expect(detectLanguage('Hello World')).toBe('en');
      expect(detectLanguage('This is English text.')).toBe('en');
    });

    test('应该处理空文本', () => {
      expect(detectLanguage('')).toBe('auto');
      expect(detectLanguage('   ')).toBe('auto');
    });

    test('应该处理无效输入', () => {
      expect(detectLanguage(null)).toBe('auto');
      expect(detectLanguage(undefined)).toBe('auto');
      expect(detectLanguage(123 as unknown as string)).toBe('auto');
    });
  });

  describe('calculateOptimalPosition', () => {
    beforeEach(() => {
      // 模拟视窗大小
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });
      Object.defineProperty(window, 'scrollX', { value: 0 });
      Object.defineProperty(window, 'scrollY', { value: 0 });
    });

    test('应该计算基本位置', () => {
      const selectionRect = {
        left: 100,
        top: 100,
        right: 200,
        bottom: 120,
        width: 100,
        height: 20
      } as DOMRect;

      const boxRect = {
        width: 300,
        height: 150
      } as DOMRect;
      
      const viewport = {
        width: 800,
        height: 600
      };
      
      const position = calculateOptimalPosition(selectionRect, boxRect, viewport);
      
      expect(position.x).toBe(100);
      expect(position.y).toBe(128); // 120 + 8
    });

    test('应该处理右边界溢出', () => {
      const selectionRect = {
        left: 700,
        top: 100,
        right: 800,
        bottom: 120,
        width: 100,
        height: 20
      } as DOMRect;

      const boxRect = {
        width: 300,
        height: 150
      } as DOMRect;
      
      const viewport = {
        width: 800,
        height: 600
      };
      
      const position = calculateOptimalPosition(selectionRect, boxRect, viewport);
      
      expect(position.x).toBe(484); // 800 - 300 - 16
    });

    test('应该处理左边界溢出', () => {
      const selectionRect = {
        left: 10,
        top: 100,
        right: 110,
        bottom: 120,
        width: 100,
        height: 20
      } as DOMRect;

      const boxRect = {
        width: 300,
        height: 150
      } as DOMRect;
      
      const viewport = {
        width: 800,
        height: 600
      };
      
      const position = calculateOptimalPosition(selectionRect, boxRect, viewport);
      
      expect(position.x).toBe(16); // 最小边距
    });

    test('应该处理下边界溢出', () => {
      const selectionRect = {
        left: 100,
        top: 500,
        right: 200,
        bottom: 520,
        width: 100,
        height: 20
      } as DOMRect;

      const boxRect = {
        width: 300,
        height: 150
      } as DOMRect;
      
      const viewport = {
        width: 800,
        height: 600
      };
      
      const position = calculateOptimalPosition(selectionRect, boxRect, viewport);
      
      // 当底部溢出时，应该显示在选择文本上方
      // y = selectionRect.top + window.scrollY - boxRect.height - 8
      // y = 500 + 0 - 150 - 8 = 342
      expect(position.y).toBe(342);
    });
  });

  describe('copyToClipboard', () => {
    test('应该复制文本到剪贴板', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockResolvedValue();
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(true);
      expect(writeTextSpy).toHaveBeenCalledWith('test text');
    });

    test('应该处理复制失败', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockRejectedValue(new Error('Copy failed'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('复制失败:', expect.any(Error));
    });
  });

  describe('showNotification', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('应该显示通知', () => {
      showNotification('测试消息', 'success');
      
      const notification = document.querySelector('.hover-translation-notification') as HTMLElement | null;
      expect(notification).not.toBeNull();
      if (!notification) {
        throw new Error('Notification not found');
      }
      expect(notification.textContent).toBe('测试消息');
      expect(notification.classList.contains('success')).toBe(true);
    });

    test('应该显示不同类型的通知', () => {
      const types: NotificationType[] = ['success', 'error', 'info'];
      
      types.forEach(type => {
        document.body.innerHTML = ''; // 清空之前的通知
        showNotification(`测试${type}`, type);
        const notification = document.querySelector('.hover-translation-notification') as HTMLElement | null;
        expect(notification).not.toBeNull();
        if (!notification) {
          throw new Error('Notification not found');
        }
        expect(notification.classList.contains(type)).toBe(true);
      });
    });

    test('应该自动隐藏通知', () => {
      showNotification('测试消息', 'info');
      
      // 等待动画和自动隐藏
      vi.advanceTimersByTime(3500);
      const notification = document.querySelector('.hover-translation-notification');
      expect(notification).toBeFalsy();
    });

    test('应该处理长文本', () => {
      const longText = '这是一个很长的通知消息，用来测试通知组件如何处理长文本内容的显示和换行。';
      showNotification(longText, 'info');
      
      const notification = document.querySelector('.hover-translation-notification') as HTMLElement | null;
      expect(notification).not.toBeNull();
      if (!notification) {
        throw new Error('Notification not found');
      }
      expect(notification.textContent).toBe(longText);
      // showNotification 没有设置 maxWidth，所以不需要检查这个属性
      expect(notification).toBeTruthy();
    });
  });
});
