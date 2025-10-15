import type { TranslationSettings, SpeechSettings, ProviderInstanceConfig } from '../shared/config-manager';
import type { TTSSynthesisRequest, TTSSynthesisResponse, ITTSProvider } from './interfaces';
import { YoudaoTTSProvider } from './providers/YoudaoTTSProvider';

interface YoudaoProviderConfig extends SpeechSettings {
  providerConfig: ProviderInstanceConfig | null;
}

export class TTSManager {
  private settings: TranslationSettings | null = null;

  private provider: ITTSProvider | null = null;

  private speechSettings: SpeechSettings | null = null;

  constructor(settings: TranslationSettings | null = null) {
    if (settings) {
      this.updateSettings(settings);
    }
  }

  updateSettings(settings: TranslationSettings): void {
    this.settings = settings;
    this.speechSettings = settings.speech ?? null;
    this.configureProvider();
  }

  isEnabled(): boolean {
    return Boolean(this.provider && this.speechSettings?.enabled && this.provider.isReady());
  }

  getSpeechSettings(): SpeechSettings | null {
    return this.speechSettings;
  }

  async synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    if (!this.isEnabled() || !this.provider) {
      throw new Error('语音合成服务未启用');
    }

    return this.provider.synthesize(request);
  }

  private configureProvider(): void {
    const speech = this.settings?.speech;
    if (!speech || !speech.enabled) {
      this.provider = null;
      return;
    }

    if (speech.provider === 'youdao') {
      const config = this.getYoudaoConfig();
      if (!config) {
        this.provider = null;
        return;
      }

      const baseConfig = {
        appKey: String(config.providerConfig?.apiKey ?? ''),
        appSecret: String(config.providerConfig?.apiSecret ?? ''),
        voiceName: config.voiceName,
        speed: config.speed,
        volume: config.volume,
        format: config.format
      };

      if (!this.provider || !(this.provider instanceof YoudaoTTSProvider)) {
        this.provider = new YoudaoTTSProvider(baseConfig);
      } else {
        this.provider.updateConfig(baseConfig);
      }
      return;
    }

    this.provider = null;
  }

  private getYoudaoConfig(): YoudaoProviderConfig | null {
    if (!this.settings?.providers) {
      return null;
    }

    const providerConfig = this.settings.providers.youdao ?? null;
    if (!providerConfig || !providerConfig.apiKey || !providerConfig.apiSecret) {
      return null;
    }

    const speech = this.settings.speech!;

    return {
      ...speech,
      providerConfig
    };
  }
}
