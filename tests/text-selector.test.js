import { vi } from 'vitest';
import { TextSelector } from '../src/content/text-selector.js';

describe('TextSelector', () => {
  let textSelector;
  let mockSelection;

  beforeEach(() => {
    vi.useFakeTimers();
    // 重置 DOM
    document.body.innerHTML = '<p id="main-text">Hello World</p>';
    const paragraph = document.getElementById('main-text');
    const textNode = paragraph.firstChild;
    
    // 创建 TextSelector 实例
    textSelector = new TextSelector();
    
    // 模拟选择对象
    mockSelection = {
      toString: () => 'Hello World',
      anchorNode: textNode,
      focusNode: textNode,
      getRangeAt: vi.fn(() => ({
        getBoundingClientRect: () => ({
          left: 10,
          top: 10,
          right: 110,
          bottom: 30,
          width: 100,
          height: 20
        }),
        commonAncestorContainer: paragraph
      })),
      rangeCount: 1
    };
    
    window.getSelection = vi.fn(() => mockSelection);
  });

  afterEach(() => {
    textSelector.destroy();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(textSelector.selectedText).toBe('');
      expect(textSelector.selectionRange).toBeNull();
      expect(textSelector.isSelecting).toBe(false);
    });

    test('应该添加事件监听器', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      textSelector.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
    });
  });

  describe('文字选择处理', () => {
    beforeEach(() => {
      textSelector.init();
    });

    test('应该检测文字选择', () => {
      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      
      // 等待防抖
      vi.advanceTimersByTime(100);
      
      expect(textSelector.selectedText).toBe('Hello World');
      expect(textSelector.selectionRange).toBeTruthy();
    });

    test('应该触发选择事件', async () => {
      const promise = new Promise((resolve) => {
        document.addEventListener('textSelected', (event) => {
          expect(event.detail.text).toBe('Hello World');
          expect(event.detail.range).toBeTruthy();
          resolve();
        });
      });
      
      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      vi.advanceTimersByTime(100);
      
      await promise;
    });

    test('应该忽略空选择', () => {
      mockSelection.toString = () => '';
      mockSelection.anchorNode = null;
      mockSelection.focusNode = null;
      mockSelection.getRangeAt.mockImplementation(() => ({
        getBoundingClientRect: () => ({
          left: 10,
          top: 10,
          right: 110,
          bottom: 30,
          width: 100,
          height: 20
        }),
        commonAncestorContainer: null
      }));
      
      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      vi.advanceTimersByTime(100);
      
      expect(textSelector.selectedText).toBe('');
    });

    test('应该忽略重复选择', () => {
      textSelector.selectedText = 'Hello World';
      mockSelection.getRangeAt.mockImplementation(() => ({
        getBoundingClientRect: () => ({
          left: 10,
          top: 10,
          right: 110,
          bottom: 30,
          width: 100,
          height: 20
        }),
        commonAncestorContainer: document.getElementById('main-text')
      }));
      
      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      vi.advanceTimersByTime(100);
      
      // 不应该触发新的事件
      expect(textSelector.selectedText).toBe('Hello World');
    });

    test('应该忽略悬浮框内部的选择', () => {
      const hoverBox = document.createElement('div');
      hoverBox.className = 'hover-translation-box';
      hoverBox.innerHTML = '<p class="inner-text">内部文本</p>';
      document.body.appendChild(hoverBox);
      const innerTextNode = hoverBox.querySelector('.inner-text').firstChild;

      mockSelection = {
        toString: () => '内部文本',
        anchorNode: innerTextNode,
        focusNode: innerTextNode,
        rangeCount: 1,
        getRangeAt: vi.fn(() => ({
          getBoundingClientRect: () => ({
            left: 20,
            top: 20,
            right: 120,
            bottom: 40,
            width: 100,
            height: 20
          }),
          commonAncestorContainer: hoverBox.querySelector('.inner-text')
        }))
      };
      window.getSelection = vi.fn(() => mockSelection);

      const eventHandler = vi.fn();
      document.addEventListener('textSelected', eventHandler);

      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      vi.advanceTimersByTime(100);

      expect(textSelector.selectedText).toBe('');
      expect(textSelector.selectionRange).toBeNull();
      expect(eventHandler).not.toHaveBeenCalled();

      document.removeEventListener('textSelected', eventHandler);
    });
  });

  describe('选择清除', () => {
    beforeEach(() => {
      textSelector.init();
      textSelector.selectedText = 'Hello World';
    });

    test('应该清除选择', async () => {
      const promise = new Promise((resolve) => {
        document.addEventListener('selectionCleared', () => {
          expect(textSelector.selectedText).toBe('');
          expect(textSelector.selectionRange).toBeNull();
          resolve();
        });
      });
      
      textSelector.clearSelection();
      await promise;
    });

    test('应该处理选择变化事件', () => {
      mockSelection.toString = () => '';
      textSelector.handleSelectionChange();
      
      expect(textSelector.selectedText).toBe('');
    });
  });

  describe('位置计算', () => {
    beforeEach(() => {
      textSelector.init();
    });

    test('应该获取选择位置', () => {
      const event = new Event('mouseup');
      textSelector.handleTextSelection(event);
      vi.advanceTimersByTime(100);
      
      const position = textSelector.getSelectionPosition();
      expect(position).toEqual({
        x: 10,
        y: 10,
        width: 100,
        height: 20,
        bottom: 30,
        right: 110
      });
    });

    test('应该处理位置获取错误', () => {
      // 设置一个有效的 selectionRange，但 getBoundingClientRect 会抛出错误
      textSelector.selectionRange = {
        getBoundingClientRect: () => {
          throw new Error('Range error');
        }
      };
      
      const position = textSelector.getSelectionPosition();
      expect(position).toBeNull();
    });
  });

  describe('配置选项', () => {
    test('应该设置最小选择长度', () => {
      textSelector.setMinSelectionLength(5);
      expect(textSelector.minSelectionLength).toBe(5);
    });

    test('应该设置最大选择长度', () => {
      textSelector.setMaxSelectionLength(100);
      expect(textSelector.maxSelectionLength).toBe(100);
    });

    test('应该验证选择长度', () => {
      textSelector.setMinSelectionLength(20);
      textSelector.setMaxSelectionLength(5);
      
      expect(textSelector.minSelectionLength).toBe(20);
      expect(textSelector.maxSelectionLength).toBe(100); // 最小100
    });
  });

  describe('键盘事件', () => {
    beforeEach(() => {
      textSelector.init();
    });

    test('应该处理 ESC 键', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      textSelector.handleKeyDown(event);
      
      expect(textSelector.selectedText).toBe('');
    });

    test('应该处理 Ctrl+A', () => {
      const event = new KeyboardEvent('keydown', { 
        key: 'a', 
        ctrlKey: true 
      });
      textSelector.handleKeyDown(event);
      
      expect(textSelector.isSelecting).toBe(true);
    });
  });

  describe('销毁', () => {
    test('应该移除事件监听器', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      textSelector.init();
      textSelector.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
    });

    test('应该清除定时器', () => {
      textSelector.init();
      textSelector.debounceTimer = setTimeout(() => {}, 100);
      
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      textSelector.destroy();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
