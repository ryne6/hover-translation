import { EVENTS } from '../shared/constants.js';

/**
 * 文字选择监听器
 */
export class TextSelector {
  constructor() {
    this.selectedText = '';
    this.selectionRange = null;
    this.isSelecting = false;
    this.debounceTimer = null;
    this.minSelectionLength = 1;
    this.maxSelectionLength = 1000;
    this.isInteractingWithHoverBox = false;
    
    // 绑定方法
    this.handleTextSelection = this.handleTextSelection.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  /**
   * 初始化选择监听器
   */
  init() {
    // 添加事件监听器
    document.addEventListener('mouseup', this.handleTextSelection);
    document.addEventListener('keyup', this.handleTextSelection);
    document.addEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleMouseDown);
    
    console.log('TextSelector initialized');
  }

  /**
   * 销毁选择监听器
   */
  destroy() {
    document.removeEventListener('mouseup', this.handleTextSelection);
    document.removeEventListener('keyup', this.handleTextSelection);
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleMouseDown);
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    console.log('TextSelector destroyed');
  }

  /**
   * 处理文字选择事件
   * @param {Event} event 事件对象
   */
  handleTextSelection(_event) {
    // 防抖处理
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
  }

  /**
   * 处理选择变化事件
   */
  handleSelectionChange() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (this.isInteractingWithHoverBox) {
      this.isInteractingWithHoverBox = false;
      return;
    }
    
    if (text === '') {
      this.clearSelection();
    }
  }

  /**
   * 处理键盘按下事件
   * @param {KeyboardEvent} event 键盘事件
   */
  handleKeyDown(event) {
    // ESC 键清除选择
    if (event.key === 'Escape') {
      this.clearSelection();
    }
    
    // Ctrl+A 全选处理
    if (event.ctrlKey && event.key === 'a') {
      this.isSelecting = true;
    }
  }

  /**
   * 处理鼠标按下事件
   * @param {MouseEvent} event 鼠标事件
   */
  handleMouseDown(event) {
    const isHoverBox = event.target.closest('.hover-translation-box');
    if (isHoverBox) {
      this.isInteractingWithHoverBox = true;
      this.isSelecting = false;
      return;
    }
    
    this.isInteractingWithHoverBox = false;
    this.isSelecting = true;
  }

  /**
   * 处理选择
   */
  processSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (this.isSelectionInsideHoverBox(selection)) {
      this.isSelecting = false;
      return;
    }

    // 检查文本长度
    if (text.length < this.minSelectionLength || text.length > this.maxSelectionLength) {
      return;
    }
    
    // 检查是否是新选择的文本
    if (text && text !== this.selectedText) {
      this.selectedText = text;
      this.selectionRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      this.triggerSelectionEvent(text);
    }
  }

  /**
   * 触发文字选择事件
   * @param {string} text 选中的文本
   */
  triggerSelectionEvent(text) {
    const event = new CustomEvent(EVENTS.TEXT_SELECTED, {
      detail: {
        text: text,
        range: this.selectionRange,
        position: this.getSelectionPosition()
      }
    });
    
    document.dispatchEvent(event);
    console.log('Text selected:', text);
  }

  /**
   * 清除选择
   */
  clearSelection() {
    if (this.selectedText) {
      this.selectedText = '';
      this.selectionRange = null;
      this.isSelecting = false;
      
      const event = new CustomEvent(EVENTS.SELECTION_CLEARED);
      document.dispatchEvent(event);
      console.log('Selection cleared');
    }
  }

  /**
   * 获取选择位置
   * @returns {Object} 位置信息
   */
  getSelectionPosition() {
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

  /**
   * 检查是否有活动选择
   * @returns {boolean} 是否有选择
   */
  hasSelection() {
    const selection = window.getSelection();
    return selection.toString().trim().length > 0;
  }

  /**
   * 获取当前选择的文本
   * @returns {string} 选择的文本
   */
  getSelectedText() {
    return this.selectedText;
  }

  /**
   * 获取当前选择范围
   * @returns {Range|null} 选择范围
   */
  getSelectionRange() {
    return this.selectionRange;
  }

  /**
   * 设置最小选择长度
   * @param {number} length 最小长度
   */
  setMinSelectionLength(length) {
    this.minSelectionLength = Math.max(1, length);
  }

  /**
   * 设置最大选择长度
   * @param {number} length 最大长度
   */
  setMaxSelectionLength(length) {
    this.maxSelectionLength = Math.max(100, length);
  }

  /**
   * 判断选择是否位于悬浮框内
   * @param {Selection} selection 当前选择对象
   * @returns {boolean} 是否在悬浮框内
   */
  isSelectionInsideHoverBox(selection) {
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const nodesToCheck = [
      selection.anchorNode,
      selection.focusNode,
      selection.getRangeAt(0)?.commonAncestorContainer || null,
    ];

    return nodesToCheck.some((node) => this.isNodeInsideHoverBox(node));
  }

  /**
   * 判断节点是否在悬浮框内
   * @param {Node|null} node 待检查的节点
   * @returns {boolean} 是否在悬浮框内
   */
  isNodeInsideHoverBox(node) {
    if (!node) return false;

    const TEXT_NODE = typeof Node !== 'undefined' ? Node.TEXT_NODE : 3;
    let current = node;

    if (current.nodeType === TEXT_NODE) {
      current = current.parentElement || current.parentNode;
    }

    while (current && current !== document) {
      if (current.classList && current.classList.contains('hover-translation-box')) {
        return true;
      }
      current = current.parentElement || current.parentNode;
    }

    return false;
  }
}
