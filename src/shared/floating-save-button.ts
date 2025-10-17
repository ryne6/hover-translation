/**
 * 浮动保存按钮配置选项
 */
export interface FloatingSaveButtonOptions {
  text?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onClick?: () => void | Promise<void>;
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * 浮动保存按钮组件
 * 用于在页面上显示固定位置的保存按钮
 */
export class FloatingSaveButton {
  private button: HTMLButtonElement | null = null;

  private visible: boolean = false;

  private options: Required<FloatingSaveButtonOptions>;

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  private saving: boolean = false;

  constructor(options: FloatingSaveButtonOptions = {}) {
    this.options = {
      text: options.text || '💾 保存配置',
      position: options.position || 'bottom-right',
      onClick: options.onClick || (() => {}),
      autoHide: options.autoHide !== undefined ? options.autoHide : false,
      autoHideDelay: options.autoHideDelay || 5000
    };
  }

  /**
   * 显示浮动按钮
   */
  show(): void {
    if (this.visible) return;

    this.button = this.createButton();
    document.body.appendChild(this.button);
    this.visible = true;

    // 添加显示动画
    requestAnimationFrame(() => {
      this.button?.classList.add('floating-save-button-show');
    });

    // 自动隐藏
    if (this.options.autoHide) {
      this.startAutoHideTimer();
    }
  }

  /**
   * 创建按钮元素
   */
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `floating-save-button floating-save-button-${this.options.position}`;
    button.textContent = this.options.text;
    button.onclick = () => this.handleClick();

    return button;
  }

  /**
   * 处理按钮点击
   */
  private async handleClick(): Promise<void> {
    if (this.saving || !this.button) return;

    this.saving = true;
    this.button.disabled = true;
    this.button.classList.add('floating-save-button-saving');
    
    const originalText = this.button.textContent;
    this.button.textContent = '⏳ 保存中...';

    try {
      await this.options.onClick();
      
      // 显示成功状态
      if (this.button) {
        this.button.textContent = '✅ 已保存';
        this.button.classList.remove('floating-save-button-saving');
        this.button.classList.add('floating-save-button-success');
      }

      // 延迟隐藏
      setTimeout(() => {
        this.hide();
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      
      // 显示错误状态
      if (this.button) {
        this.button.textContent = '❌ 保存失败';
        this.button.classList.remove('floating-save-button-saving');
        this.button.classList.add('floating-save-button-error');
      }

      // 恢复原状态
      setTimeout(() => {
        if (this.button) {
          this.button.textContent = originalText || this.options.text;
          this.button.classList.remove('floating-save-button-error');
          this.button.disabled = false;
          this.saving = false;
        }
      }, 2000);
    }
  }

  /**
   * 隐藏浮动按钮
   */
  hide(): void {
    if (!this.visible || !this.button) return;

    this.clearAutoHideTimer();
    this.button.classList.remove('floating-save-button-show');
    this.button.classList.add('floating-save-button-hide');

    setTimeout(() => {
      if (this.button) {
        this.button.remove();
        this.button = null;
      }
      this.visible = false;
      this.saving = false;
    }, 300);
  }

  /**
   * 更新按钮文本
   */
  setText(text: string): void {
    if (this.button && !this.saving) {
      this.button.textContent = text;
    }
  }

  /**
   * 更新按钮位置
   */
  setPosition(position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'): void {
    if (!this.button) return;

    // 移除旧位置类
    this.button.classList.remove(
      'floating-save-button-bottom-right',
      'floating-save-button-bottom-left',
      'floating-save-button-top-right',
      'floating-save-button-top-left'
    );

    // 添加新位置类
    this.button.classList.add(`floating-save-button-${position}`);
    this.options.position = position;
  }

  /**
   * 检查按钮是否可见
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * 检查是否正在保存
   */
  isSaving(): boolean {
    return this.saving;
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
   * 重置自动隐藏计时器
   */
  resetAutoHideTimer(): void {
    if (this.options.autoHide && this.visible) {
      this.startAutoHideTimer();
    }
  }

  /**
   * 销毁按钮
   */
  destroy(): void {
    this.clearAutoHideTimer();
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
    this.visible = false;
    this.saving = false;
  }
}
