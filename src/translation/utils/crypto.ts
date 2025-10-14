import { md5 as md5Hash } from './md5';

/**
 * 加密工具函数
 * 提供 MD5、SHA、HMAC 及随机数工具
 */

const textEncoder = new TextEncoder();

type BinaryInput = string | ArrayBuffer | ArrayBufferView;

function getSubtle(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('SubtleCrypto not available in current environment');
}

function toArrayBuffer(data: BinaryInput): ArrayBuffer {
  if (typeof data === 'string') {
    return textEncoder.encode(data).buffer;
  }
  if (data instanceof ArrayBuffer) {
    return data.slice(0);
  }
  if (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(new Uint8Array(data));
    return copy.buffer;
  }
  if (ArrayBuffer.isView(data)) {
    const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const copy = new Uint8Array(view.length);
    copy.set(view);
    return copy.buffer;
  }
  throw new TypeError('Unsupported data type for cryptographic operation');
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * MD5 哈希
 */
export function md5(str: string): string {
  return md5Hash(str);
}

/**
 * SHA256 哈希
 */
export async function sha256(str: string): Promise<string> {
  const data = textEncoder.encode(str);
  const digest = await getSubtle().digest('SHA-256', data);
  return bufferToHex(digest);
}

/**
 * SHA1 哈希
 */
export async function sha1(str: string): Promise<string> {
  const data = textEncoder.encode(str);
  const digest = await getSubtle().digest('SHA-1', data);
  return bufferToHex(digest);
}

/**
 * HMAC-SHA256 (原始字节输出)
 */
export async function hmacSha256Raw(key: BinaryInput, message: string): Promise<ArrayBuffer> {
  const subtle = getSubtle();
  const cryptoKey = await subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return subtle.sign('HMAC', cryptoKey, textEncoder.encode(message));
}

/**
 * HMAC-SHA256 (十六进制输出)
 */
export async function hmacSha256(key: BinaryInput, message: string): Promise<string> {
  const signature = await hmacSha256Raw(key, message);
  return bufferToHex(signature);
}

/**
 * 生成随机十六进制字符串
 */
export function randomHex(length = 16): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return bufferToHex(bytes).slice(0, length);
}
