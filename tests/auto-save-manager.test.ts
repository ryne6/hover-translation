import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AutoSaveManager } from '../src/options/auto-save-manager';
import type { TranslationSettings } from '../src/shared/config-manager';

describe('AutoSaveManager', () => {
  let manager: AutoSaveManager;
  let mockSettings: TranslationSettings;
  let onSaveMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    onSaveMock = vi.fn<[TranslationSettings], Promise<boolean>>().mockResolvedValue(true);
    
    manager = new AutoSaveManager({
      autoSaveEnabled: true,
      showSuggestions: true,
      showFloatingButton: true,
      onSave: onSaveMock
    });

    mockSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: 'test-key',
          apiSecret: 'test-secret'
        }
      },
      primaryProvider: 'youdao',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true
    };

    manager.setSettings(mockSettings);
  });

  test('应该能够设置和获取配置', () => {
    expect(manager.getSettings()).toEqual(mockSettings);
  });

  test('验证成功后应该自动保存', async () => {
    await manager.onValidationSuccess('youdao', {
      enabled: true,
      apiKey: 'test-key',
      apiSecret: 'test-secret'
    });

    expect(onSaveMock).toHaveBeenCalled();
  });

  test('应该能够启用/禁用自动保存', () => {
    manager.disableAutoSave();
    expect(manager.isAutoSaveEnabled()).toBe(false);

    manager.enableAutoSave();
    expect(manager.isAutoSaveEnabled()).toBe(true);
  });

  test('应该能够启用/禁用配置建议', () => {
    manager.disableSuggestions();
    expect(manager.isSuggestionsEnabled()).toBe(false);

    manager.enableSuggestions();
    expect(manager.isSuggestionsEnabled()).toBe(true);
  });
});
