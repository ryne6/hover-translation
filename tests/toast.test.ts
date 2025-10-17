import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastNotification, toast } from '../src/shared/toast';

describe('ToastNotification', () => {
  let toastInstance: ToastNotification;

  beforeEach(() => {
    document.body.innerHTML = '';
    toastInstance = ToastNotification.getInstance();
  });

  afterEach(() => {
    toastInstance.destroy();
  });

  describe('单例模式', () => {
    test('应该返回同一个实例', () => {
      const instance1 = ToastNotification.getInstance();
      const instance2 = ToastNotification.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('显示 Toast', () => {
    test('应该显示 info 类型的 Toast', () => {
      const toastId = toastInstance.info('测试消息');
      expect(toastId).toBeTruthy();
      
      const toastElement = document.querySelector('.toast-info');
      expect(toastElement).toBeTruthy();
      expect(toastElement?.textContent).toContain('测试消息');
    });

    test('应该显示 success 类型的 Toast', () => {
      toastInstance.success('成功消息');
      
      const toastElement = document.querySelector('.toast-success');
      expect(toastElement).toBeTruthy();
      expect(toastElement?.textContent).toContain('成功消息');
    });

    test('应该显示 error 类型的 Toast', () => {
      toastInstance.error('错误消息');
      
      const toastElement = document.querySelector('.toast-error');
      expect(toastElement).toBeTruthy();
      expect(toastElement?.textContent).toContain('错误消息');
    });

    test('应该显示 warning 类型的 Toast', () => {
      toastInstance.warning('警告消息');
      
      const toastElement = document.querySelector('.toast-warning');
      expect(toastElement).toBeTruthy();
      expect(toastElement?.textContent).toContain('警告消息');
    });

    test('应该包含正确的图标', () => {
      toastInstance.info('测试');
      const icon = document.querySelector('.toast-icon');
      expect(icon?.textContent).toBe('ℹ️');
    });

    test('应该包含关闭按钮', () => {
      toastInstance.show('测试', { closable: true });
      const closeBtn = document.querySelector('.toast-close');
      expect(closeBtn).toBeTruthy();
    });

    test('应该支持不显示关闭按钮', () => {
      toastInstance.show('测试', { closable: false });
      const closeBtn = document.querySelector('.toast-close');
      expect(closeBtn).toBeFalsy();
    });
  });

  describe('隐藏 Toast', () => {
    test('应该能够手动隐藏 Toast', () => {
      const toastId = toastInstance.info('测试');
      toastInstance.hide(toastId);
      
      setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        expect(toastElement).toBeFalsy();
      }, 400);
    });

    test('应该能够隐藏所有 Toast', () => {
      toastInstance.info('消息1');
      toastInstance.success('消息2');
      toastInstance.error('消息3');
      
      toastInstance.hideAll();
      
      setTimeout(() => {
        const toasts = document.querySelectorAll('.toast');
        expect(toasts.length).toBe(0);
      }, 400);
    });

    test('点击关闭按钮应该隐藏 Toast', () => {
      toastInstance.info('测试');
      const closeBtn = document.querySelector('.toast-close') as HTMLButtonElement;
      
      closeBtn?.click();
      
      setTimeout(() => {
        const toastElement = document.querySelector('.toast');
        expect(toastElement).toBeFalsy();
      }, 400);
    });
  });

  describe('自动隐藏', () => {
    test('应该在指定时间后自动隐藏', async () => {
      vi.useFakeTimers();
      
      toastInstance.show('测试', { duration: 1000 });
      
      let toastElement = document.querySelector('.toast');
      expect(toastElement).toBeTruthy();
      
      vi.advanceTimersByTime(1000);
      
      await vi.waitFor(() => {
        toastElement = document.querySelector('.toast');
        expect(toastElement).toBeFalsy();
      });
      
      vi.useRealTimers();
    });

    test('duration 为 0 时不应该自动隐藏', async () => {
      vi.useFakeTimers();
      
      toastInstance.show('测试', { duration: 0 });
      
      vi.advanceTimersByTime(5000);
      
      const toastElement = document.querySelector('.toast');
      expect(toastElement).toBeTruthy();
      
      vi.useRealTimers();
    });
  });

  describe('位置', () => {
    test('应该支持 top-right 位置', () => {
      toastInstance.show('测试', { position: 'top-right' });
      const toastElement = document.querySelector('.toast-top-right');
      expect(toastElement).toBeTruthy();
    });

    test('应该支持 top-left 位置', () => {
      toastInstance.show('测试', { position: 'top-left' });
      const toastElement = document.querySelector('.toast-top-left');
      expect(toastElement).toBeTruthy();
    });

    test('应该支持 bottom-right 位置', () => {
      toastInstance.show('测试', { position: 'bottom-right' });
      const toastElement = document.querySelector('.toast-bottom-right');
      expect(toastElement).toBeTruthy();
    });

    test('应该支持 bottom-left 位置', () => {
      toastInstance.show('测试', { position: 'bottom-left' });
      const toastElement = document.querySelector('.toast-bottom-left');
      expect(toastElement).toBeTruthy();
    });

    test('应该支持 top-center 位置', () => {
      toastInstance.show('测试', { position: 'top-center' });
      const toastElement = document.querySelector('.toast-top-center');
      expect(toastElement).toBeTruthy();
    });
  });

  describe('便捷方法', () => {
    test('toast.info 应该正常工作', () => {
      toast.info('测试');
      const toastElement = document.querySelector('.toast-info');
      expect(toastElement).toBeTruthy();
    });

    test('toast.success 应该正常工作', () => {
      toast.success('测试');
      const toastElement = document.querySelector('.toast-success');
      expect(toastElement).toBeTruthy();
    });

    test('toast.error 应该正常工作', () => {
      toast.error('测试');
      const toastElement = document.querySelector('.toast-error');
      expect(toastElement).toBeTruthy();
    });

    test('toast.warning 应该正常工作', () => {
      toast.warning('测试');
      const toastElement = document.querySelector('.toast-warning');
      expect(toastElement).toBeTruthy();
    });

    test('toast.hideAll 应该正常工作', () => {
      toast.info('测试1');
      toast.success('测试2');
      toast.hideAll();
      
      setTimeout(() => {
        const toasts = document.querySelectorAll('.toast');
        expect(toasts.length).toBe(0);
      }, 400);
    });
  });

  describe('销毁', () => {
    test('应该能够销毁实例', () => {
      toastInstance.info('测试');
      toastInstance.destroy();
      
      const container = document.querySelector('.toast-container');
      expect(container).toBeFalsy();
    });
  });
});
