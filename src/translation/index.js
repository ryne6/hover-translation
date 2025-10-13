/**
 * 翻译模块主入口
 */

// 导出核心类
export { TranslationManager } from './core/TranslationManager.js';
export { AdapterFactory } from './core/AdapterFactory.js';
export { CacheManager } from './core/CacheManager.js';
export { StatsManager } from './core/StatsManager.js';

// 导出接口
export { ITranslationAdapter } from './interfaces/ITranslationAdapter.js';
export { BaseTranslationAdapter } from './adapters/base/BaseTranslationAdapter.js';

// 导出错误类
export * from './interfaces/errors.js';

// 导出工具
export * from './utils/language-codes.js';

// 导出适配器（如果需要直接访问）
export { GoogleTranslateAdapter } from './adapters/traditional/GoogleTranslateAdapter.js';
export { BaiduTranslateAdapter } from './adapters/traditional/BaiduTranslateAdapter.js';
export { DeepLAdapter } from './adapters/traditional/DeepLAdapter.js';
export { MicrosoftTranslatorAdapter } from './adapters/traditional/MicrosoftTranslatorAdapter.js';
export { YoudaoTranslateAdapter } from './adapters/traditional/YoudaoTranslateAdapter.js';
export { TencentTranslateAdapter } from './adapters/traditional/TencentTranslateAdapter.js';
export { OpenAIAdapter } from './adapters/ai/OpenAIAdapter.js';
export { ClaudeAdapter } from './adapters/ai/ClaudeAdapter.js';
export { GeminiAdapter } from './adapters/ai/GeminiAdapter.js';

/**
 * 创建默认的翻译管理器实例
 * @param {import('./interfaces/types.js').TranslationManagerConfig} config
 * @returns {Promise<TranslationManager>}
 */
export async function createTranslationManager(config) {
  const manager = new TranslationManager();
  await manager.initialize(config);
  return manager;
}

/**
 * 获取所有可用的提供商
 * @returns {import('./interfaces/types.js').ProviderInfo[]}
 */
export function getAllProviders() {
  return AdapterFactory.getAvailableProviders();
}

/**
 * 根据分类获取提供商
 * @param {'traditional'|'ai'|'local'} category
 * @returns {import('./interfaces/types.js').ProviderInfo[]}
 */
export function getProvidersByCategory(category) {
  return AdapterFactory.getProvidersByCategory(category);
}
