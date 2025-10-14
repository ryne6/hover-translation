/**
 * 翻译模块主入口
 */

import { TranslationManager } from './core/TranslationManager';
import { AdapterFactory } from './core/AdapterFactory';
import type { ProviderInfo, TranslationManagerConfig } from './interfaces/types';

export { TranslationManager } from './core/TranslationManager';
export { AdapterFactory } from './core/AdapterFactory';
export { CacheManager } from './core/CacheManager';
export { StatsManager } from './core/StatsManager';

export { ITranslationAdapter } from './interfaces/ITranslationAdapter';
export { BaseTranslationAdapter } from './adapters/base/BaseTranslationAdapter';

export * from './interfaces/errors';
export * from './utils/language-codes';

export { GoogleTranslateAdapter } from './adapters/traditional/GoogleTranslateAdapter';
export { BaiduTranslateAdapter } from './adapters/traditional/BaiduTranslateAdapter';
export { DeepLAdapter } from './adapters/traditional/DeepLAdapter';
export { MicrosoftTranslatorAdapter } from './adapters/traditional/MicrosoftTranslatorAdapter';
export { YoudaoTranslateAdapter } from './adapters/traditional/YoudaoTranslateAdapter';
export { TencentTranslateAdapter } from './adapters/traditional/TencentTranslateAdapter';
export { OpenAIAdapter } from './adapters/ai/OpenAIAdapter';
export { ClaudeAdapter } from './adapters/ai/ClaudeAdapter';
export { GeminiAdapter } from './adapters/ai/GeminiAdapter';

/**
 * 创建默认的翻译管理器实例
 * @param {import('./interfaces/types').TranslationManagerConfig} config
 * @returns {Promise<TranslationManager>}
 */
export async function createTranslationManager(config: TranslationManagerConfig) {
  const manager = new TranslationManager();
  await manager.initialize(config);
  return manager;
}

/**
 * 获取所有可用的提供商
 * @returns {import('./interfaces/types').ProviderInfo[]}
 */
export function getAllProviders(): ProviderInfo[] {
  return AdapterFactory.getAvailableProviders();
}

/**
 * 根据分类获取提供商
 * @param {'traditional'|'ai'|'local'} category
 * @returns {import('./interfaces/types').ProviderInfo[]}
 */
export function getProvidersByCategory(category: ProviderInfo['category']): ProviderInfo[] {
  return AdapterFactory.getProvidersByCategory(category);
}
