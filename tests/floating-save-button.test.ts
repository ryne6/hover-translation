import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { FloatingSaveButton } from '../src/shared/floating-save-button';

describe('FloatingSaveButton', () => {
  let button: FloatingSaveButton;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (button) {
      button.destroy();
    }
  });

  describe('创建和显示', () => {
    test('应该创建浮动按钮', () => {
      button = new FloatingSaveButton();
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement).toBeTruthy();
    });

    test('应该显示默认文本', () => {
      button = new FloatingSaveButton();
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement?.textContent).toBe('💾 保存配置');
    });

    test('应该支持自定义文本', () => {
      button = new FloatingSaveButton({ text: '自定义文本' });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement?.textContent).toBe('自定义文本');
    });

    test('应该支持不同位置', () => {
      button = new FloatingSaveButton({ position: 'bottom-left' });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button-bottom-left');
      expect(buttonElement).toBeTruthy();
    });

    test('重复调用 show 不应该创建多个按钮', () => {
      button = new FloatingSaveButton();
      button.show();
      button.show();
      
      const buttons = document.querySelectorAll('.floating-save-button');
      expect(buttons.length).toBe(1);
    });
  });

  describe('隐藏', () => {
    test('应该能够隐藏按钮', async () => {
      button = new FloatingSaveButton();
      button.show();
      button.hide();
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement).toBeFalsy();
    });

    test('隐藏不存在的按钮不应该报错', () => {
      button = new FloatingSaveButton();
      expect(() => button.hide()).not.toThrow();
    });
  });

  describe('点击事件', () => {
    test('应该触发 onClick 回调', async () => {
      const onClick = vi.fn().mockResolvedValue(undefined);
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(onClick).toHaveBeenCalled();
    });

    test('保存成功后应该显示成功状态', async () => {
      const onClick = vi.fn().mockResolvedValue(undefined);
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(buttonElement?.textContent).toBe('✅ 已保存');
    });

    test('保存失败后应该显示错误状态', async () => {
      const onClick = vi.fn().mockRejectedValue(new Error('保存失败'));
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(buttonElement?.textContent).toBe('❌ 保存失败');
    });

    test('保存中时按钮应该被禁用', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(buttonElement?.disabled).toBe(true);
      expect(buttonElement?.textContent).toBe('⏳ 保存中...');
    });
  });

  describe('文本更新', () => {
    test('应该能够更新按钮文本', () => {
      button = new FloatingSaveButton();
      button.show();
      button.setText('新文本');
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement?.textContent).toBe('新文本');
    });

    test('保存中时不应该更新文本', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      button.setText('新文本');
      expect(buttonElement?.textContent).not.toBe('新文本');
    });
  });

  describe('位置更新', () => {
    test('应该能够更新按钮位置', () => {
      button = new FloatingSaveButton({ position: 'bottom-right' });
      button.show();
      button.setPosition('top-left');
      
      const buttonElement = document.querySelector('.floating-save-button-top-left');
      expect(buttonElement).toBeTruthy();
    });
  });

  describe('状态查询', () => {
    test('isVisible 应该返回正确的状态', () => {
      button = new FloatingSaveButton();
      expect(button.isVisible()).toBe(false);
      
      button.show();
      expect(button.isVisible()).toBe(true);
      
      button.hide();
      expect(button.isVisible()).toBe(false);
    });

    test('isSaving 应该返回正确的状态', async () => {
      const onClick = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      button = new FloatingSaveButton({ onClick });
      button.show();
      
      expect(button.isSaving()).toBe(false);
      
      const buttonElement = document.querySelector('.floating-save-button') as HTMLButtonElement;
      buttonElement?.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(button.isSaving()).toBe(true);
    });
  });

  describe('自动隐藏', () => {
    test('启用自动隐藏时应该在指定时间后隐藏', async () => {
      vi.useFakeTimers();
      
      button = new FloatingSaveButton({ autoHide: true, autoHideDelay: 2000 });
      button.show();
      
      expect(button.isVisible()).toBe(true);
      
      vi.advanceTimersByTime(2000);
      
      await vi.waitFor(() => {
        expect(button.isVisible()).toBe(false);
      });
      
      vi.useRealTimers();
    });

    test('默认不应该自动隐藏', async () => {
      vi.useFakeTimers();
      
      button = new FloatingSaveButton();
      button.show();
      
      vi.advanceTimersByTime(10000);
      
      expect(button.isVisible()).toBe(true);
      
      vi.useRealTimers();
    });
  });

  describe('销毁', () => {
    test('应该能够销毁按钮', () => {
      button = new FloatingSaveButton();
      button.show();
      button.destroy();
      
      const buttonElement = document.querySelector('.floating-save-button');
      expect(buttonElement).toBeFalsy();
      expect(button.isVisible()).toBe(false);
    });
  });
});
