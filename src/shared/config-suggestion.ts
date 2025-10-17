/**
 * 配置建议按钮配置
 */
export interface SuggestionAction {
  label: string;
  handler: () => void | Promise<void>;
  primary?: boolean;
}

/**
 * 配置建议选项
 */
export interface ConfigSuggestionOptions {
  type?: 'info' | 'warning' | 'success';
  message: string;
  actions: SuggestionAction[];
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onDismiss?: () => void;
}

/**
 * 配置建议组件
 * 用于显示配置相关的智能提示和建议
 */
export class ConfigSuggestion {
  private container: HTMLDivElement | null = null;

  private visible: boolean = false;

  private options: ConfigSuggestionOptions;

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ConfigSuggestionOptions) {
    this.options = {
      type: options.type || 'info',
      dismissible: options.dismissible !== false,
      autoHide: options.autoHide || false,
      autoHideDelay: options.autoHideDelay || 10000,
      ...options
    };
  }

  /**
   * 显示建议卡片
   */
  show(targetElement?: HTMLElement): void {
    if (this.visible) return;

    this.container = this.createContainer();
    
    if (targetElement) {
      // 在指定元素之前插入
      targetElement.parentNode?.insertBefore(this.container, targetElement);
    } else {
      // 默认添加到 body
      document.body.appendChild(this.container);
    }

    this.visible = true;

    // 添加显示动画
    requestAnimationFrame(() => {
      this.container?.classList.add('config-suggestion-show');
    });

    // 自动隐藏
    if (this.options.autoHide) {
      this.startAutoHideTimer();
    }
  }

  /**
   * 创建建议容器
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = `config-suggestion config-suggestion-${this.options.type}`;

    // 图标
    const icon = this.getIcon(this.options.type || 'info');
    const iconEl = document.createElement('div');
    iconEl.className = 'config-suggestion-icon';
    iconEl.textContent = icon;

    // 内容区域
    const content = document.createElement('div');
    content.className = 'config-suggestion-content';

    // 消息
    const message = document.createElement('div');
    message.className = 'config-suggestion-message';
    message.textContent = this.options.message;

    // 按钮区域
    const actions = document.createElement('div');
    actions.className = 'config-suggestion-actions';

    this.options.actions.forEach((action) => {
      const button = document.createElement('button');
      button.className = action.primary
        ? 'config-suggestion-btn config-suggestion-btn-primary'
        : 'config-suggestion-btn config-suggestion-btn-secondary';
      button.textContent = action.label;
      button.onclick = async () => {
        await this.handleAction(action);
      };
      actions.appendChild(button);
    });

    content.appendChild(message);
    content.appendChild(actions);

    container.appendChild(iconEl);
    container.appendChild(content);

    // 关闭按钮
    if (this.options.dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'config-suggestion-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => this.dismiss();
      container.appendChild(closeBtn);
    }

    return container;
  }

  /**
   * 获取类型对应的图标
   */
  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      info: '💡',
      warning: '⚠️',
      success: '✅'
    };
    return icons[type] || icons.info;
  }

  /**
   * 处理按钮点击
   */
  private async handleAction(action: SuggestionAction): Promise<void> {
    try {
      await action.handler();
      this.hide();
    } catch (error) {
      console.error('执行操作失败:', error);
    }
  }

  /**
   * 隐藏建议卡片
   */
  hide(): void {
    if (!this.visible || !this.container) return;

    this.clearAutoHideTimer();
    this.container.classList.remove('config-suggestion-show');
    this.container.classList.add('config-suggestion-hide');

    setTimeout(() => {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      this.visible = false;
    }, 300);
  }

  /**
   * 关闭建议（触发 onDismiss 回调）
   */
  dismiss(): void {
    if (this.options.onDismiss) {
      this.options.onDismiss();
    }
    this.hide();
  }

  /**
   * 更新消息
   */
  updateMessage(message: string): void {
    if (!this.container) return;

    const messageEl = this.container.querySelector('.config-suggestion-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * 启动自动隐藏计时器
   */
  private startAutoHideTimer(): void {
    this.clearAutoHideTimer();
    this.autoHideTimer = setTimeout(() => {
      this.hide();
    }, this.options.autoHideDelay);
  }

  /**
   * 清除自动隐藏计时器
   */
  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  /**
   * 销毁建议卡片
   */
  destroy(): void {
    this.clearAutoHideTimer();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.visible = false;
  }
}
