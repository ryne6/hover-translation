import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ConfigSuggestion } from '../src/shared/config-suggestion';

describe('ConfigSuggestion', () => {
  let suggestion: ConfigSuggestion;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (suggestion) {
      suggestion.destroy();
    }
  });

  test('应该能够显示建议卡片', () => {
    const handler = vi.fn();
    suggestion = new ConfigSuggestion({
      message: '测试建议',
      actions: [
        { label: '确定', handler, primary: true }
      ]
    });

    suggestion.show();

    const card = document.querySelector('.config-suggestion');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('测试建议');
  });

  test('应该能够点击按钮', () => {
    const handler = vi.fn();
    suggestion = new ConfigSuggestion({
      message: '测试',
      actions: [{ label: '确定', handler }]
    });

    suggestion.show();

    const button = document.querySelector('.config-suggestion-btn') as HTMLButtonElement;
    button?.click();

    expect(handler).toHaveBeenCalled();
  });

  test('应该能够关闭建议', () => {
    suggestion = new ConfigSuggestion({
      message: '测试',
      actions: []
    });

    suggestion.show();
    suggestion.hide();

    setTimeout(() => {
      const card = document.querySelector('.config-suggestion');
      expect(card).toBeFalsy();
    }, 400);
  });
});
