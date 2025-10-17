/**
 * Shadow DOM 包装器
 * 提供 Shadow DOM 的创建、管理和事件处理功能
 */

export interface ShadowDOMOptions {
  mode?: 'open' | 'closed';
  delegatesFocus?: boolean;
}

export interface EventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}

/**
 * Shadow DOM 包装器类
 * 封装 Shadow DOM 的创建和管理逻辑
 */
export class ShadowDOMWrapper {
  private container: HTMLElement;

  private shadowRoot: ShadowRoot;

  private eventListeners: Map<string, Map<EventListener, EventListenerOptions>> = new Map();

  private styleCache: Map<string, HTMLStyleElement> = new Map();

  constructor(tagName: string = 'div', options: ShadowDOMOptions = {}) {
    // 创建容器元素
    this.container = document.createElement(tagName);
    
    // 创建 Shadow DOM
    const shadowOptions: ShadowRootInit = {
      mode: options.mode || 'closed',
      delegatesFocus: options.delegatesFocus || false
    };
    
    this.shadowRoot = this.container.attachShadow(shadowOptions);
  }

  /**
   * 获取容器元素（Light DOM）
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * 获取 Shadow Root
   */
  getShadowRoot(): ShadowRoot {
    return this.shadowRoot;
  }

  /**
   * 注入样式到 Shadow DOM
   */
  injectStyles(css: string, id?: string): HTMLStyleElement {
    // 检查缓存
    if (id && this.styleCache.has(id)) {
      return this.styleCache.get(id)!;
    }

    const style = document.createElement('style');
    style.textContent = css;
    
    if (id) {
      style.id = id;
      this.styleCache.set(id, style);
    }

    this.shadowRoot.appendChild(style);
    return style;
  }

  /**
   * 移除样式
   */
  removeStyles(id: string): boolean {
    const style = this.styleCache.get(id);
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
      this.styleCache.delete(id);
      return true;
    }
    return false;
  }

  /**
   * 设置 Shadow DOM 内容
   */
  setContent(html: string): void {
    // 清除现有内容（保留样式）
    const styles = Array.from(this.shadowRoot.querySelectorAll('style'));
    this.shadowRoot.innerHTML = '';
    
    // 重新添加样式
    styles.forEach(style => this.shadowRoot.appendChild(style));
    
    // 添加新内容
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    this.shadowRoot.appendChild(wrapper);
  }

  /**
   * 在 Shadow DOM 内添加事件监听器
   */
  addEventListener(
    type: string,
    listener: EventListener,
    options: EventListenerOptions = {}
  ): void {
    this.shadowRoot.addEventListener(type, listener, options);
    
    // 记录监听器以便后续移除
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Map());
    }
    this.eventListeners.get(type)!.set(listener, options);
  }

  /**
   * 移除 Shadow DOM 内的事件监听器
   */
  removeEventListener(type: string, listener: EventListener): void {
    const typeListeners = this.eventListeners.get(type);
    if (typeListeners && typeListeners.has(listener)) {
      const options = typeListeners.get(listener)!;
      this.shadowRoot.removeEventListener(type, listener, options);
      typeListeners.delete(listener);
      
      if (typeListeners.size === 0) {
        this.eventListeners.delete(type);
      }
    }
  }

  /**
   * 在 Shadow DOM 内查找元素
   */
  querySelector<T extends Element = Element>(selector: string): T | null {
    return this.shadowRoot.querySelector<T>(selector);
  }

  /**
   * 在 Shadow DOM 内查找所有匹配元素
   */
  querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return this.shadowRoot.querySelectorAll<T>(selector);
  }

  /**
   * 将容器添加到页面
   */
  appendTo(parent: Element = document.body): void {
    parent.appendChild(this.container);
  }

  /**
   * 从页面移除容器
   */
  remove(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * 设置容器样式
   */
  setContainerStyle(styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(this.container.style, styles);
  }

  /**
   * 设置容器类名
   */
  setContainerClass(className: string): void {
    this.container.className = className;
  }

  /**
   * 检查点击是否在 Shadow DOM 内部
   */
  containsClick(event: MouseEvent): boolean {
    // 使用 composedPath 获取完整的事件路径
    const path = event.composedPath();
    return path.includes(this.container);
  }

  /**
   * 获取 Shadow DOM 内的实际点击目标
   */
  getClickTarget(event: MouseEvent): Element | null {
    const path = event.composedPath();
    
    // 找到 Shadow DOM 内的第一个元素
    for (const element of path) {
      if (element instanceof Element && this.shadowRoot.contains(element)) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * 销毁 Shadow DOM 包装器
   */
  destroy(): void {
    // 移除所有事件监听器
    this.eventListeners.forEach((listeners, type) => {
      listeners.forEach((options, listener) => {
        this.shadowRoot.removeEventListener(type, listener, options);
      });
    });
    this.eventListeners.clear();
    
    // 清除样式缓存
    this.styleCache.clear();
    
    // 移除容器
    this.remove();
  }

  /**
   * 检查浏览器是否支持 Shadow DOM
   */
  static isSupported(): boolean {
    return 'attachShadow' in Element.prototype;
  }

  /**
   * 创建带有基础样式的 Shadow DOM
   */
  static createWithBaseStyles(
    css: string,
    tagName: string = 'div',
    options: ShadowDOMOptions = {}
  ): ShadowDOMWrapper {
    const wrapper = new ShadowDOMWrapper(tagName, options);
    wrapper.injectStyles(css, 'base-styles');
    return wrapper;
  }
}
