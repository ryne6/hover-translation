import { EVENTS } from '../shared/constants';

export type SelectionPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

export type SelectionEventDetail = {
  text: string;
  range: Range | null;
  position: SelectionPosition | null;
};

declare global {
  interface DocumentEventMap {
    [EVENTS.TEXT_SELECTED]: CustomEvent<SelectionEventDetail>;
    [EVENTS.SELECTION_CLEARED]: CustomEvent<void>;
  }
}

export class TextSelector {
  private selectedText = '';

  private selectionRange: Range | null = null;

  private isSelecting = false;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private minSelectionLength = 1;

  private maxSelectionLength = 1000;

  private isInteractingWithHoverBox = false;

  init(): void {
    document.addEventListener('mouseup', this.handleTextSelection);
    document.addEventListener('keyup', this.handleTextSelection);
    document.addEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleMouseDown);
    console.log('TextSelector initialized');
  }

  destroy(): void {
    document.removeEventListener('mouseup', this.handleTextSelection);
    document.removeEventListener('keyup', this.handleTextSelection);
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleMouseDown);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.log('TextSelector destroyed');
  }

  private handleTextSelection = (_event: Event): void => {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.isInteractingWithHoverBox) {
        this.isInteractingWithHoverBox = false;
        this.isSelecting = false;
        return;
      }

      this.processSelection();
    }, 100);
  };

  private handleSelectionChange = (): void => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (this.isInteractingWithHoverBox) {
      this.isInteractingWithHoverBox = false;
      return;
    }

    if (text === '') {
      this.clearSelection();
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.clearSelection();
    }

    if (event.ctrlKey && event.key === 'a') {
      this.isSelecting = true;
    }
  };

  private handleMouseDown = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    const isHoverBox = target?.closest('.hover-translation-box');
    if (isHoverBox) {
      this.isInteractingWithHoverBox = true;
      this.isSelecting = false;
      return;
    }

    this.isInteractingWithHoverBox = false;
    this.isSelecting = true;
  };

  private processSelection(): void {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (this.isSelectionInsideHoverBox(selection)) {
      this.isSelecting = false;
      return;
    }

    if (text.length < this.minSelectionLength || text.length > this.maxSelectionLength) {
      return;
    }

    if (text && text !== this.selectedText) {
      this.selectedText = text;
      this.selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      this.triggerSelectionEvent(text);
    }
  }

  private triggerSelectionEvent(text: string): void {
    const event = new CustomEvent<SelectionEventDetail>(EVENTS.TEXT_SELECTED, {
      detail: {
        text,
        range: this.selectionRange,
        position: this.getSelectionPosition()
      }
    });

    document.dispatchEvent(event);
    console.log('Text selected:', text);
  }

  clearSelection(): void {
    if (this.selectedText) {
      this.selectedText = '';
      this.selectionRange = null;
      this.isSelecting = false;

      const event = new CustomEvent(EVENTS.SELECTION_CLEARED);
      document.dispatchEvent(event);
      console.log('Selection cleared');
    }
  }

  getSelectionPosition(): SelectionPosition | null {
    if (!this.selectionRange) {
      return null;
    }

    try {
      const rect = this.selectionRange.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX
      };
    } catch (error) {
      console.error('获取选择位置失败:', error);
      return null;
    }
  }

  hasSelection(): boolean {
    const selection = window.getSelection();
    return (selection?.toString().trim().length ?? 0) > 0;
  }

  getSelectedText(): string {
    return this.selectedText;
  }

  getSelectionRange(): Range | null {
    return this.selectionRange;
  }

  setMinSelectionLength(length: number): void {
    this.minSelectionLength = Math.max(1, length);
  }

  setMaxSelectionLength(length: number): void {
    this.maxSelectionLength = Math.max(100, length);
  }

  private isSelectionInsideHoverBox(selection: Selection | null): boolean {
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const nodesToCheck: Array<Node | null> = [
      selection.anchorNode,
      selection.focusNode,
      selection.getRangeAt(0)?.commonAncestorContainer ?? null
    ];

    return nodesToCheck.some((node) => this.isNodeInsideHoverBox(node));
  }

  private isNodeInsideHoverBox(node: Node | null): boolean {
    if (!node) return false;

    const TEXT_NODE = typeof Node !== 'undefined' ? Node.TEXT_NODE : 3;
    let current: Node | null = node;

    if (current.nodeType === TEXT_NODE) {
      current = current.parentElement ?? current.parentNode;
    }

    while (current && current !== document) {
      if ('classList' in current && (current as Element).classList.contains('hover-translation-box')) {
        return true;
      }
      current = (current as Element).parentElement ?? (current as Element).parentNode;
    }

    return false;
  }
}
