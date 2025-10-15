import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { YoudaoTTSProvider } from '../src/tts/providers/YoudaoTTSProvider';
import { TTSManager } from '../src/tts/TTSManager';
import { StatsManager } from '../src/translation/core/StatsManager';
import type { TranslationSettings } from '../src/shared/config-manager';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 真实的有道 API 配置
const REAL_YOUDAO_CONFIG = {
  appKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
  appSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
  voiceName: 'youxiaoqin',
  speed: '1.0',
  volume: '1.0',
  format: 'mp3' as const
};

describe('TTS Simple Integration Tests', () => {
  test('should create YoudaoTTSProvider with valid config', () => {
    const provider = new YoudaoTTSProvider(REAL_YOUDAO_CONFIG);
    expect(provider.isReady()).toBe(true);
  });

  test('should create TTSManager with valid settings', () => {
    const settings: TranslationSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || REAL_YOUDAO_CONFIG.appKey,
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || REAL_YOUDAO_CONFIG.appSecret
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
        voiceName: REAL_YOUDAO_CONFIG.voiceName,
        speed: REAL_YOUDAO_CONFIG.speed,
        volume: REAL_YOUDAO_CONFIG.volume,
        format: REAL_YOUDAO_CONFIG.format
      }
    };

    const ttsManager = new TTSManager(settings);
    expect(ttsManager.isEnabled()).toBe(true);
    expect(ttsManager.getSpeechSettings()).toEqual(settings.speech);
  });

  test('should validate text input correctly', async () => {
    const provider = new YoudaoTTSProvider(REAL_YOUDAO_CONFIG);

    // 测试空文本
    await expect(provider.synthesize({ text: '' })).rejects.toThrow('无法合成空文本');

    // 测试超长文本
    const longText = 'a'.repeat(3000);
    await expect(provider.synthesize({ text: longText })).rejects.toThrow('文本过长，最多支持 2048 字节');

    // 测试正常文本长度
    const normalText = 'Hello World';
    // 这里我们不实际调用 API，只测试验证逻辑
    expect(normalText.length).toBeLessThan(2048);
  });

  test('should handle different voice configurations', () => {
    const voices = ['youxiaoqin', 'youxiaozhi', 'youxiaoxun', 'youxiaoyun'];
    
    voices.forEach(voice => {
      const config = { ...REAL_YOUDAO_CONFIG, voiceName: voice };
      const provider = new YoudaoTTSProvider(config);
      expect(provider.isReady()).toBe(true);
    });
  });

  test('should handle different speed and volume settings', () => {
    const speeds = ['0.5', '1.0', '1.5', '2.0'];
    const volumes = ['0.5', '1.0', '2.0', '3.0'];

    speeds.forEach(speed => {
      volumes.forEach(volume => {
        const config = { 
          ...REAL_YOUDAO_CONFIG, 
          speed, 
          volume 
        };
        const provider = new YoudaoTTSProvider(config);
        expect(provider.isReady()).toBe(true);
      });
    });
  });

  test('should update TTSManager settings correctly', () => {
    const initialSettings: TranslationSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || REAL_YOUDAO_CONFIG.appKey,
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || REAL_YOUDAO_CONFIG.appSecret
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

    const ttsManager = new TTSManager(initialSettings);
    expect(ttsManager.isEnabled()).toBe(true);

    // 更新设置
    const updatedSettings = {
      ...initialSettings,
      speech: {
        ...initialSettings.speech!,
        voiceName: 'youxiaozhi',
        speed: '1.5',
        volume: '2.0'
      }
    };

    ttsManager.updateSettings(updatedSettings);
    expect(ttsManager.isEnabled()).toBe(true);
    expect(ttsManager.getSpeechSettings()?.voiceName).toBe('youxiaozhi');
    expect(ttsManager.getSpeechSettings()?.speed).toBe('1.5');
    expect(ttsManager.getSpeechSettings()?.volume).toBe('2.0');
  });

  test('should disable TTS when speech is disabled', () => {
    const settings: TranslationSettings = {
      providers: {
        youdao: {
          enabled: true,
          apiKey: process.env.YOUDAO_TTS_APP_KEY || REAL_YOUDAO_CONFIG.appKey,
          apiSecret: process.env.YOUDAO_TTS_APP_SECRET || REAL_YOUDAO_CONFIG.appSecret
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
        enabled: false,
        provider: 'youdao',
        voiceName: 'youxiaoqin',
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    };

    const ttsManager = new TTSManager(settings);
    expect(ttsManager.isEnabled()).toBe(false);
  });

  test('should disable TTS when youdao provider is not configured', () => {
    const settings: TranslationSettings = {
      providers: {},
      primaryProvider: '',
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
    expect(ttsManager.isEnabled()).toBe(false);
  });
});

describe('TTS Stats Integration', () => {
  let statsManager: StatsManager;

  beforeEach(() => {
    statsManager = new StatsManager();
  });

  test('should track TTS usage statistics', async () => {
    // 记录成功的 TTS 请求
    await statsManager.recordTTSSuccess('Hello World', 1500);
    await statsManager.recordTTSSuccess('你好世界', 2000);

    // 记录失败的 TTS 请求
    await statsManager.recordTTSFailure(new Error('API Error'));

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.requests).toBe(3);
    expect(ttsStats.successes).toBe(2);
    expect(ttsStats.failures).toBe(1);
    expect(ttsStats.characters).toBe('Hello World'.length + '你好世界'.length);
    expect(ttsStats.successRate).toBe('66.67%');
    expect(ttsStats.averageResponseTime).toBe(1750); // (1500 + 2000) / 2
  });

  test('should handle TTS error tracking', async () => {
    const errors = [
      new Error('Network timeout'),
      new Error('Invalid credentials'),
      new Error('Rate limit exceeded')
    ];

    for (const error of errors) {
      await statsManager.recordTTSFailure(error);
    }

    const ttsStats = statsManager.getTTSStats();
    expect(ttsStats.failures).toBe(3);
    expect(ttsStats.errors).toHaveLength(3);
    expect(ttsStats.errors[0].message).toBe('Network timeout');
    expect(ttsStats.errors[1].message).toBe('Invalid credentials');
    expect(ttsStats.errors[2].message).toBe('Rate limit exceeded');
  });
});

describe('TTS Configuration Validation', () => {
  test('should validate youdao TTS configuration', () => {
    // 有效配置
    const validConfig = {
      appKey: '64c324fc88e92434',
      appSecret: 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
      voiceName: 'youxiaoqin',
      speed: '1.0',
      volume: '1.0',
      format: 'mp3' as const
    };

    const provider = new YoudaoTTSProvider(validConfig);
    expect(provider.isReady()).toBe(true);

    // 无效配置 - 缺少 appKey
    const invalidConfig1 = {
      ...validConfig,
      appKey: ''
    };

    const provider1 = new YoudaoTTSProvider(invalidConfig1);
    expect(provider1.isReady()).toBe(false);

    // 无效配置 - 缺少 appSecret
    const invalidConfig2 = {
      ...validConfig,
      appSecret: ''
    };

    const provider2 = new YoudaoTTSProvider(invalidConfig2);
    expect(provider2.isReady()).toBe(false);

    // 无效配置 - null
    const provider3 = new YoudaoTTSProvider(null);
    expect(provider3.isReady()).toBe(false);
  });

  test('should handle voice name validation', () => {
    const validVoices = [
      'youxiaoqin', 'youxiaozhi', 'youxiaoxun', 'youxiaoyun',
      'youxiaoyao', 'youxiaoyu', 'youxiaoyi', 'youxiaoyue'
    ];

    validVoices.forEach(voice => {
      const config = {
        appKey: process.env.YOUDAO_TTS_APP_KEY || '64c324fc88e92434',
        appSecret: process.env.YOUDAO_TTS_APP_SECRET || 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
        voiceName: voice,
        speed: '1.0',
        volume: '1.0',
        format: 'mp3' as const
      };

      const provider = new YoudaoTTSProvider(config);
      expect(provider.isReady()).toBe(true);
    });
  });

  test('should handle speed and volume range validation', () => {
    const validSpeeds = ['0.5', '0.8', '1.0', '1.2', '1.5', '2.0'];
    const validVolumes = ['0.5', '0.8', '1.0', '2.0', '3.0', '5.0'];

    validSpeeds.forEach(speed => {
      validVolumes.forEach(volume => {
        const config = {
          appKey: '64c324fc88e92434',
          appSecret: 'BzP7tAruUdEHsmELim9klPE3jHNOm2uX',
          voiceName: 'youxiaoqin',
          speed,
          volume,
          format: 'mp3' as const
        };

        const provider = new YoudaoTTSProvider(config);
        expect(provider.isReady()).toBe(true);
      });
    });
  });
});

describe('TTS Error Scenarios', () => {
  test('should handle text validation errors', async () => {
    const provider = new YoudaoTTSProvider(REAL_YOUDAO_CONFIG);

    // 空文本
    await expect(provider.synthesize({ text: '' })).rejects.toThrow('无法合成空文本');

    // 超长文本
    const longText = 'a'.repeat(3000);
    await expect(provider.synthesize({ text: longText })).rejects.toThrow('文本过长，最多支持 2048 字节');
  });

  test('should handle provider not ready errors', async () => {
    const provider = new YoudaoTTSProvider(null);
    
    await expect(provider.synthesize({ text: 'Hello' })).rejects.toThrow('语音合成服务未启用或缺少凭证');
  });

  test('should handle TTSManager disabled errors', async () => {
    const settings: TranslationSettings = {
      providers: {},
      primaryProvider: '',
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
        enabled: false,
        provider: 'youdao',
        voiceName: 'youxiaoqin',
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    };

    const ttsManager = new TTSManager(settings);
    
    await expect(ttsManager.synthesize({ text: 'Hello' })).rejects.toThrow('语音合成服务未启用');
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
