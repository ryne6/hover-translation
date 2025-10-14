import { vi } from 'vitest';
import { TextSelector } from '../src/content/text-selector';
import { getPrivate, setPrivate } from './helpers/private-access';

type MutableSelection = Selection & Record<string, unknown>;

const invokeHandler = <T extends (...args: any[]) => unknown>(
  selector: TextSelector,
  key: string
): T => getPrivate<T>(selector, key);

const createMockSelection = (paragraph: HTMLElement): MutableSelection => {
  const textNode = paragraph.firstChild;
  const selection = {
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
  } as unknown as MutableSelection;

  return selection;
};

describe('TextSelector', () => {
  let textSelector: TextSelector;
  let mockSelection: MutableSelection;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<p id="main-text">Hello World</p>';
    const paragraph = document.getElementById('main-text') as HTMLElement;

    textSelector = new TextSelector();
    mockSelection = createMockSelection(paragraph);

    (window as Partial<typeof window>).getSelection = vi.fn(() => mockSelection);
  });

  afterEach(() => {
    textSelector.destroy();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const triggerSelection = (event: Event) => {
    const handler = invokeHandler<(evt: Event) => void>(textSelector, 'handleTextSelection');
    handler(event);
  };

  const triggerSelectionChange = () => {
    const handler = invokeHandler<() => void>(textSelector, 'handleSelectionChange');
    handler();
  };

  const triggerKeyDown = (event: KeyboardEvent) => {
    const handler = invokeHandler<(evt: KeyboardEvent) => void>(textSelector, 'handleKeyDown');
    handler(event);
  };

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
      expect(getPrivate<Range | null>(textSelector, 'selectionRange')).toBeNull();
      expect(getPrivate<boolean>(textSelector, 'isSelecting')).toBe(false);
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
      triggerSelection(new Event('mouseup'));
      vi.advanceTimersByTime(100);

      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('Hello World');
      expect(getPrivate<Range | null>(textSelector, 'selectionRange')).toBeTruthy();
    });

    test('应该触发选择事件', async () => {
      const promise = new Promise<void>((resolve) => {
        document.addEventListener('textSelected', (event: Event) => {
          const detail = (event as CustomEvent).detail;
          expect(detail.text).toBe('Hello World');
          expect(detail.range).toBeTruthy();
          resolve();
        }, { once: true });
      });

      triggerSelection(new Event('mouseup'));
      vi.advanceTimersByTime(100);

      await promise;
    });

    test('应该忽略空选择', () => {
      mockSelection.toString = () => '';
      setPrivate(mockSelection, 'anchorNode', null);
      setPrivate(mockSelection, 'focusNode', null);

      const getRangeAt = mockSelection.getRangeAt as unknown as ReturnType<typeof vi.fn>;
      getRangeAt.mockImplementation(() => ({
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

      triggerSelection(new Event('mouseup'));
      vi.advanceTimersByTime(100);

      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
    });

    test('应该忽略重复选择', () => {
      setPrivate(textSelector, 'selectedText', 'Hello World');

      const getRangeAt = mockSelection.getRangeAt as unknown as ReturnType<typeof vi.fn>;
      getRangeAt.mockImplementation(() => ({
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

      triggerSelection(new Event('mouseup'));
      vi.advanceTimersByTime(100);

      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('Hello World');
    });

    test('应该忽略悬浮框内部的选择', () => {
      const hoverBox = document.createElement('div');
      hoverBox.className = 'hover-translation-box';
      hoverBox.innerHTML = '<p class="inner-text">内部文本</p>';
      document.body.appendChild(hoverBox);
      const innerTextNode = hoverBox.querySelector('.inner-text')?.firstChild ?? null;

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
      } as unknown as MutableSelection;

      (window as Partial<typeof window>).getSelection = vi.fn(() => mockSelection);

      const eventHandler = vi.fn();
      document.addEventListener('textSelected', eventHandler);

      triggerSelection(new Event('mouseup'));
      vi.advanceTimersByTime(100);

      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
      expect(getPrivate<Range | null>(textSelector, 'selectionRange')).toBeNull();
      expect(eventHandler).not.toHaveBeenCalled();

      document.removeEventListener('textSelected', eventHandler);
      hoverBox.remove();
    });
  });

  describe('选择清除', () => {
    beforeEach(() => {
      textSelector.init();
      setPrivate(textSelector, 'selectedText', 'Hello World');
    });

    test('应该清除选择', async () => {
      const promise = new Promise<void>((resolve) => {
        document.addEventListener('selectionCleared', () => {
          expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
          expect(getPrivate<Range | null>(textSelector, 'selectionRange')).toBeNull();
          resolve();
        }, { once: true });
      });

      textSelector.clearSelection();
      await promise;
    });

    test('应该处理选择变化事件', () => {
      mockSelection.toString = () => '';
      triggerSelectionChange();

      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
    });
  });

  describe('位置计算', () => {
    beforeEach(() => {
      textSelector.init();
    });

    test('应该获取选择位置', () => {
      triggerSelection(new Event('mouseup'));
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
      setPrivate(textSelector, 'selectionRange', {
        getBoundingClientRect: () => {
          throw new Error('Range error');
        }
      });

      const position = textSelector.getSelectionPosition();
      expect(position).toBeNull();
    });
  });

  describe('配置选项', () => {
    test('应该设置最小选择长度', () => {
      textSelector.setMinSelectionLength(5);
      expect(textSelector.getSelectedText()).toBe('');
      expect(getPrivate<number>(textSelector, 'minSelectionLength')).toBe(5);
    });

    test('应该设置最大选择长度', () => {
      textSelector.setMaxSelectionLength(100);
      expect(getPrivate<number>(textSelector, 'maxSelectionLength')).toBe(100);
    });

    test('应该验证选择长度', () => {
      textSelector.setMinSelectionLength(20);
      textSelector.setMaxSelectionLength(5);

      expect(getPrivate<number>(textSelector, 'minSelectionLength')).toBe(20);
      expect(getPrivate<number>(textSelector, 'maxSelectionLength')).toBe(100);
    });
  });

  describe('键盘事件', () => {
    beforeEach(() => {
      textSelector.init();
    });

    test('应该处理 ESC 键', () => {
      triggerKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(getPrivate<string>(textSelector, 'selectedText')).toBe('');
    });

    test('应该处理 Ctrl+A', () => {
      triggerKeyDown(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
      expect(getPrivate<boolean>(textSelector, 'isSelecting')).toBe(true);
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
      const timer = setTimeout(() => {}, 100);
      setPrivate(textSelector, 'debounceTimer', timer);

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      textSelector.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
    });
  });
});
