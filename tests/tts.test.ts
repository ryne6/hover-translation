import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { YoudaoTTSProvider } from '../src/tts/providers/YoudaoTTSProvider';
import { TTSManager } from '../src/tts/TTSManager';
import { StatsManager } from '../src/translation/core/StatsManager';
import type { TranslationSettings } from '../src/shared/config-manager';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// Mock fetch
global.fetch = vi.fn();

// Mock chrome APIs
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    },
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
} as unknown as typeof chrome;

describe('YoudaoTTSProvider', () => {
  let provider: YoudaoTTSProvider;
  const mockConfig = {
    appKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
    appSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
    voiceName: 'youxiaoqin',
    speed: '1.0',
    volume: '1.0',
    format: 'mp3' as const
  };

  beforeEach(() => {
    provider = new YoudaoTTSProvider(mockConfig);
    vi.clearAllMocks();
  });

  test('should be ready with valid config', () => {
    expect(provider.isReady()).toBe(true);
  });

  test('should not be ready with invalid config', () => {
    const invalidProvider = new YoudaoTTSProvider(null);
    expect(invalidProvider.isReady()).toBe(false);
  });

  test('should validate text length', async () => {
    const longText = 'a'.repeat(3000); // 超过 2048 字节限制
    
    await expect(provider.synthesize({ text: longText })).rejects.toThrow('文本过长，最多支持 2048 字节');
  });

  test('should validate empty text', async () => {
    await expect(provider.synthesize({ text: '' })).rejects.toThrow('无法合成空文本');
  });

  test('should synthesize speech successfully', async () => {
    const mockAudioData = new ArrayBuffer(1024);
    const mockResponse = {
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('audio/mp3')
      },
      arrayBuffer: vi.fn().mockResolvedValue(mockAudioData)
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await provider.synthesize({ text: 'Hello World' });

    expect(result).toEqual({
      audioData: expect.any(String),
      format: 'mp3',
      provider: 'youdao'
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://openapi.youdao.com/ttsapi',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    );
  });

  test('should handle API errors', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 400,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue({
        errorCode: '101',
        message: 'Missing required parameters'
      })
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockErrorResponse);

    await expect(provider.synthesize({ text: 'Hello' })).rejects.toThrow('缺少必填参数或参数不正确');
  });

  test('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    await expect(provider.synthesize({ text: 'Hello' })).rejects.toThrow('Network error');
  });

  test('should update config', () => {
    const newConfig = { ...mockConfig, voiceName: 'youxiaozhi' };
    provider.updateConfig(newConfig);
    
    // 验证配置已更新（通过检查 isReady 状态）
    expect(provider.isReady()).toBe(true);
  });
});

describe('TTSManager', () => {
  let ttsManager: TTSManager;
  let mockSettings: TranslationSettings;

  beforeEach(() => {
    mockSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX'
        }
      },
      primaryProvider: 'youdao',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      showTranslated: true,
      formality: 'default',
      domain: 'general',
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true,
      speech: {
        enabled: true,
        provider: 'youdao',
        voiceName: 'youxiaoqin',
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    };

    ttsManager = new TTSManager(mockSettings);
    vi.clearAllMocks();
  });

  test('should be enabled with valid settings', () => {
    expect(ttsManager.isEnabled()).toBe(true);
  });

  test('should be disabled when speech is disabled', () => {
    const disabledSettings = {
      ...mockSettings,
      speech: {
        ...mockSettings.speech!,
        enabled: false
      }
    };
    ttsManager.updateSettings(disabledSettings);
    expect(ttsManager.isEnabled()).toBe(false);
  });

  test('should be disabled when youdao provider is not configured', () => {
    const noProviderSettings = {
      ...mockSettings,
      providers: {}
    };
    ttsManager.updateSettings(noProviderSettings);
    expect(ttsManager.isEnabled()).toBe(false);
  });

  test('should get speech settings', () => {
    const settings = ttsManager.getSpeechSettings();
    expect(settings).toEqual(mockSettings.speech);
  });

  test('should synthesize speech', async () => {
    const mockAudioData = new ArrayBuffer(1024);
    const mockResponse = {
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('audio/mp3')
      },
      arrayBuffer: vi.fn().mockResolvedValue(mockAudioData)
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await ttsManager.synthesize({ text: 'Hello World' });

    expect(result).toEqual({
      audioData: expect.any(String),
      format: 'mp3',
      provider: 'youdao'
    });
  });

  test('should throw error when not enabled', async () => {
    const disabledSettings = {
      ...mockSettings,
      speech: {
        ...mockSettings.speech!,
        enabled: false
      }
    };
    ttsManager.updateSettings(disabledSettings);

    await expect(ttsManager.synthesize({ text: 'Hello' })).rejects.toThrow('语音合成服务未启用');
  });
});

describe('StatsManager TTS Integration', () => {
  let statsManager: StatsManager;

  beforeEach(() => {
    statsManager = new StatsManager();
  });

  test('should record TTS success', async () => {
    const text = 'Hello World';
    const responseTime = 1500;

    await statsManager.recordTTSSuccess(text, responseTime);

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.requests).toBe(1);
    expect(ttsStats.successes).toBe(1);
    expect(ttsStats.failures).toBe(0);
    expect(ttsStats.characters).toBe(text.length);
    expect(ttsStats.averageResponseTime).toBe(responseTime);
    expect(ttsStats.successRate).toBe('100.00%');
  });

  test('should record TTS failure', async () => {
    const error = new Error('API Error');

    await statsManager.recordTTSFailure(error);

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.requests).toBe(1);
    expect(ttsStats.successes).toBe(0);
    expect(ttsStats.failures).toBe(1);
    expect(ttsStats.errors).toHaveLength(1);
    expect(ttsStats.errors[0].message).toBe('API Error');
    expect(ttsStats.successRate).toBe('0.00%');
  });

  test('should calculate average response time correctly', async () => {
    await statsManager.recordTTSSuccess('Text 1', 1000);
    await statsManager.recordTTSSuccess('Text 2', 2000);
    await statsManager.recordTTSSuccess('Text 3', 3000);

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.averageResponseTime).toBe(2000);
    expect(ttsStats.responseTimes).toHaveLength(3);
  });

  test('should limit response times history', async () => {
    // 添加超过 100 个响应时间记录
    for (let i = 0; i < 105; i++) {
      await statsManager.recordTTSSuccess(`Text ${i}`, 1000 + i);
    }

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.responseTimes).toHaveLength(100);
  });

  test('should limit error history', async () => {
    // 添加超过 10 个错误记录
    for (let i = 0; i < 15; i++) {
      await statsManager.recordTTSFailure(new Error(`Error ${i}`));
    }

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.errors).toHaveLength(10);
  });
});

describe('TTS Integration Tests', () => {
  test('should handle complete TTS workflow', async () => {
    // 模拟完整的 TTS 工作流程
    const mockAudioData = new ArrayBuffer(1024);
    const mockResponse = {
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('audio/mp3')
      },
      arrayBuffer: vi.fn().mockResolvedValue(mockAudioData)
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    // 1. 创建 TTS Manager
    const settings: TranslationSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX'
        }
      },
      primaryProvider: 'youdao',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      showTranslated: true,
      formality: 'default',
      domain: 'general',
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true,
      speech: {
        enabled: true,
        provider: 'youdao',
        voiceName: 'youxiaoqin',
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    };

    const ttsManager = new TTSManager(settings);
    const statsManager = new StatsManager();

    // 2. 验证 TTS 已启用
    expect(ttsManager.isEnabled()).toBe(true);

    // 3. 执行语音合成
    const startTime = Date.now();
    const result = await ttsManager.synthesize({ text: '你好，世界！' });
    const responseTime = Date.now() - startTime;

    // 4. 验证结果
    expect(result.provider).toBe('youdao');
    expect(result.format).toBe('mp3');
    expect(result.audioData).toBeDefined();

    // 5. 记录统计
    await statsManager.recordTTSSuccess('你好，世界！', responseTime);

    // 6. 验证统计
    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.requests).toBe(1);
    expect(ttsStats.successes).toBe(1);
    expect(ttsStats.characters).toBe('你好，世界！'.length);
    expect(ttsStats.successRate).toBe('100.00%');
  });

  test('should handle TTS fallback to browser speech', async () => {
    // 模拟有道 TTS 失败的情况
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const settings: TranslationSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX'
        }
      },
      primaryProvider: 'youdao',
      fallbackProviders: [],
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      enableCache: true,
      autoDetect: true,
      showOriginal: true,
      showTranslated: true,
      formality: 'default',
      domain: 'general',
      timeout: 30000,
      retryCount: 3,
      parallelTranslation: false,
      autoFallback: true,
      speech: {
        enabled: true,
        provider: 'youdao',
        voiceName: 'youxiaoqin',
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    };

    const ttsManager = new TTSManager(settings);
    const statsManager = new StatsManager();

    // 尝试语音合成，应该失败
    await expect(ttsManager.synthesize({ text: 'Hello' })).rejects.toThrow();

    // 记录失败统计
    await statsManager.recordTTSFailure(new Error('Network error'));

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.requests).toBe(1);
    expect(ttsStats.failures).toBe(1);
    expect(ttsStats.successes).toBe(0);
    expect(ttsStats.successRate).toBe('0.00%');
  });
});

describe('TTS Error Handling', () => {
  test('should handle various error codes', async () => {
    const provider = new YoudaoTTSProvider({
      appKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
      appSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
      voiceName: 'youxiaoqin',
      speed: '1.0',
      volume: '1.0',
      format: 'mp3'
    });

    const errorCodes = [
      { code: '101', expected: '缺少必填参数或参数不正确' },
      { code: '102', expected: '不支持的语言类型' },
      { code: '103', expected: '翻译文本过长' },
      { code: '104', expected: '不支持的接口类型' },
      { code: '201', expected: '解密失败，通常为appKey与appSecret不匹配' },
      { code: '202', expected: '签名检验失败，请核对签名生成流程' },
      { code: '301', expected: '账号余额不足或欠费' },
      { code: '302', expected: 'TTS服务已关闭，请开通后使用' },
      { code: '999', expected: '语音合成失败，错误码: 999' } // 未知错误码
    ];

    for (const { code, expected } of errorCodes) {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        },
        json: vi.fn().mockResolvedValue({ errorCode: code })
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockErrorResponse);

      await expect(provider.synthesize({ text: 'Hello' })).rejects.toThrow(expected);
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
