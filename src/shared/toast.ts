/**
 * Toast 通知类型
 */
export type ToastType = 'info' | 'success' | 'error' | 'warning';

/**
 * Toast 配置选项
 */
export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  closable?: boolean;
}

/**
 * Toast 通知组件
 * 用于显示临时提示信息
 */
export class ToastNotification {
  private static instance: ToastNotification | null = null;

  private container: HTMLDivElement | null = null;

  private toasts: Map<string, HTMLDivElement> = new Map();

  private constructor() {
    this.createContainer();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ToastNotification {
    if (!ToastNotification.instance) {
      ToastNotification.instance = new ToastNotification();
    }
    return ToastNotification.instance;
  }

  /**
   * 创建 Toast 容器
   */
  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * 显示 Toast 通知
   */
  show(message: string, options: ToastOptions = {}): string {
    const {
      type = 'info',
      duration = 3000,
      position = 'top-right',
      closable = true
    } = options;

    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = this.createToastElement(toastId, message, type, position, closable);

    if (this.container) {
      this.container.appendChild(toast);
    }

    this.toasts.set(toastId, toast);

    // 添加显示动画
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // 自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toastId);
      }, duration);
    }

    return toastId;
  }

  /**
   * 创建 Toast 元素
   */
  private createToastElement(
    id: string,
    message: string,
    type: ToastType,
    position: string,
    closable: boolean
  ): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-${position}`;
    toast.dataset.toastId = id;

    // 图标
    const icon = this.getIcon(type);
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = icon;

    // 消息
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    toast.appendChild(iconEl);
    toast.appendChild(messageEl);

    // 关闭按钮
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => this.hide(id);
      toast.appendChild(closeBtn);
    }

    return toast;
  }

  /**
   * 获取类型对应的图标
   */
  private getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    return icons[type] || icons.info;
  }

  /**
   * 隐藏 Toast
   */
  hide(toastId: string): void {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
      toast.remove();
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * 隐藏所有 Toast
   */
  hideAll(): void {
    this.toasts.forEach((_toast, id) => {
      this.hide(id);
    });
  }

  /**
   * 显示信息提示
   */
  info(message: string, duration?: number): string {
    return this.show(message, { type: 'info', duration });
  }

  /**
   * 显示成功提示
   */
  success(message: string, duration?: number): string {
    return this.show(message, { type: 'success', duration });
  }

  /**
   * 显示错误提示
   */
  error(message: string, duration?: number): string {
    return this.show(message, { type: 'error', duration });
  }

  /**
   * 显示警告提示
   */
  warning(message: string, duration?: number): string {
    return this.show(message, { type: 'warning', duration });
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.hideAll();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    ToastNotification.instance = null;
  }
}

// 导出便捷方法
export const toast = {
  show: (message: string, options?: ToastOptions) => ToastNotification.getInstance().show(message, options),
  info: (message: string, duration?: number) => ToastNotification.getInstance().info(message, duration),
  success: (message: string, duration?: number) => ToastNotification.getInstance().success(message, duration),
  error: (message: string, duration?: number) => ToastNotification.getInstance().error(message, duration),
  warning: (message: string, duration?: number) => ToastNotification.getInstance().warning(message, duration),
  hide: (toastId: string) => ToastNotification.getInstance().hide(toastId),
  hideAll: () => ToastNotification.getInstance().hideAll()
};
