import { randomHex, sha256 } from '../../translation/utils/crypto';
import type { ITTSProvider, TTSSynthesisRequest, TTSSynthesisResponse } from '../interfaces';

interface YoudaoTTSConfig {
  appKey: string;
  appSecret: string;
  voiceName: string;
  speed: string;
  volume: string;
  format: 'mp3' | 'wav';
}

interface YoudaoTTSError {
  errorCode: string;
  [key: string]: unknown;
}

const API_ENDPOINT = 'https://openapi.youdao.com/ttsapi';
const MAX_TEXT_BYTES = 2048;

const encoder = new TextEncoder();

function truncateInput(q: string): string {
  if (q.length <= 20) {
    return q;
  }
  return `${q.substring(0, 10)}${q.length}${q.substring(q.length - 10)}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function mapErrorCode(error: string | number): string {
  const known: Record<string, string> = {
    '101': '缺少必填参数或参数不正确',
    '102': '不支持的语言类型',
    '103': '翻译文本过长',
    '104': '不支持的接口类型',
    '105': '不支持的签名类型',
    '106': '不支持的响应类型',
    '107': '不支持的传输加密类型',
    '108': '应用ID无效或已被禁用',
    '109': 'batchLog格式不正确',
    '110': '无相关服务的有效实例',
    '111': '开发者账号无效或已被封禁',
    '112': '访问频率受限',
    '113': 'q不能为空',
    '114': '不支持的音频格式',
    '201': '解密失败，通常为appKey与appSecret不匹配',
    '202': '签名检验失败，请核对签名生成流程',
    '203': '翻译服务不可用或异常',
    '205': '请求的接口无效',
    '301': '账号余额不足或欠费',
    '302': 'TTS服务已关闭，请开通后使用',
    '303': '服务超过调用频率限制'
  };

  const key = String(error);
  return known[key] || `语音合成失败，错误码: ${key}`;
}

export class YoudaoTTSProvider implements ITTSProvider {
  private config: YoudaoTTSConfig | null;

  constructor(config: YoudaoTTSConfig | null) {
    this.config = config;
  }

  updateConfig(config: YoudaoTTSConfig | null): void {
    this.config = config;
  }

  isReady(): boolean {
    return Boolean(this.config?.appKey && this.config?.appSecret);
  }

  private validateText(text: string): void {
    const bytes = encoder.encode(text);
    if (bytes.length === 0) {
      throw new Error('无法合成空文本');
    }
    if (bytes.length > MAX_TEXT_BYTES) {
      throw new Error('文本过长，最多支持 2048 字节');
    }
  }

  async synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    if (!this.config || !this.isReady()) {
      throw new Error('语音合成服务未启用或缺少凭证');
    }

    const { appKey, appSecret, voiceName, speed, volume, format } = this.config;
    const text = request.text;

    this.validateText(text);

    const salt = randomHex(16);
    const curtime = Math.floor(Date.now() / 1000).toString();
    const input = truncateInput(text);
    const signSource = `${appKey}${input}${salt}${curtime}${appSecret}`;
    const sign = await sha256(signSource);

    const params: Record<string, string> = {
      q: text,
      appKey,
      salt,
      voiceName: request.voiceName || voiceName,
      signType: 'v3',
      curtime,
      format: request.format || format || 'mp3',
      speed: request.speed || speed || '1.0',
      volume: request.volume || volume || '1.0',
      sign
    };

    const body = new URLSearchParams(params);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const data = (await response.json()) as YoudaoTTSError;
        throw new Error(mapErrorCode(data.errorCode ?? response.status));
      }
      throw new Error(`语音合成失败: HTTP ${response.status}`);
    }

    if (contentType.includes('audio')) {
      const buffer = await response.arrayBuffer();
      return {
        audioData: arrayBufferToBase64(buffer),
        format: params.format === 'wav' ? 'wav' : 'mp3',
        provider: 'youdao'
      };
    }

    // 处理返回的 JSON 错误
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as YoudaoTTSError;
      throw new Error(mapErrorCode(data.errorCode ?? 'unknown'));
    }

    throw new Error('语音合成失败：未知响应类型');
  }
}
