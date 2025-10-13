/**
 * 翻译请求
 * @typedef {Object} TranslationRequest
 * @property {string} text - 要翻译的文本
 * @property {string} sourceLang - 源语言代码
 * @property {string} targetLang - 目标语言代码
 * @property {TranslationOptions} [options] - 可选配置
 */

/**
 * 翻译选项
 * @typedef {Object} TranslationOptions
 * @property {'formal'|'informal'|'default'} [formality] - 翻译正式程度
 * @property {string} [context] - 上下文信息
 * @property {'general'|'medical'|'legal'|'technical'|'finance'} [domain] - 专业领域
 * @property {Object.<string, string>} [glossary] - 术语词典
 * @property {boolean} [preserveFormatting] - 保留格式
 * @property {string} [preferredProvider] - 首选提供商
 */

/**
 * 翻译响应
 * @typedef {Object} TranslationResponse
 * @property {string} translatedText - 翻译后的文本
 * @property {string} [detectedSourceLanguage] - 检测到的源语言
 * @property {number} [confidence] - 翻译置信度 (0-1)
 * @property {Array<{text: string, confidence: number}>} [alternatives] - 备选翻译
 * @property {string} provider - 提供商ID
 * @property {string} [model] - 使用的模型
 * @property {number} timestamp - 时间戳
 * @property {UsageInfo} [usage] - 使用情况
 */

/**
 * 使用信息
 * @typedef {Object} UsageInfo
 * @property {number} [characters] - 字符数
 * @property {number} [tokens] - Token数
 * @property {number} [cost] - 成本（美元）
 */

/**
 * 语言检测结果
 * @typedef {Object} LanguageDetectionResult
 * @property {string} language - 语言代码
 * @property {number} confidence - 置信度 (0-1)
 * @property {Array<{language: string, confidence: number}>} [alternatives] - 备选语言
 */

/**
 * 提供商信息
 * @typedef {Object} ProviderInfo
 * @property {string} id - 提供商ID
 * @property {string} name - 英文名称
 * @property {string} displayName - 显示名称（本地化）
 * @property {string} description - 描述
 * @property {string} logo - Logo URL
 * @property {'traditional'|'ai'|'local'} category - 分类
 * @property {Language[]} supportedLanguages - 支持的语言
 * @property {ProviderFeature[]} features - 功能特性
 * @property {boolean} requiresApiKey - 是否需要API Key
 * @property {boolean} [requiresApiSecret] - 是否需要API Secret
 * @property {PricingInfo} pricing - 价格信息
 * @property {RateLimitInfo} [rateLimit] - 速率限制
 * @property {string} [homepage] - 官网
 * @property {string} [documentation] - 文档地址
 */

/**
 * 语言
 * @typedef {Object} Language
 * @property {string} code - 语言代码
 * @property {string} name - 英文名称
 * @property {string} nativeName - 本地名称
 */

/**
 * 提供商特性
 * @typedef {Object} ProviderFeature
 * @property {string} name - 特性名称
 * @property {string} description - 特性描述
 * @property {boolean} available - 是否可用
 */

/**
 * 价格信息
 * @typedef {Object} PricingInfo
 * @property {'free'|'freemium'|'paid'|'usage-based'} model - 定价模式
 * @property {string} [freeQuota] - 免费额度
 * @property {string} [paidPricing] - 付费价格
 * @property {'character'|'token'|'request'} billingUnit - 计费单位
 * @property {string} details - 详细说明
 */

/**
 * 速率限制
 * @typedef {Object} RateLimitInfo
 * @property {number} [requestsPerSecond] - 每秒请求数
 * @property {number} [requestsPerDay] - 每天请求数
 * @property {number} [charactersPerRequest] - 每次请求字符数
 */

/**
 * 配额信息
 * @typedef {Object} QuotaInfo
 * @property {number} used - 已使用量
 * @property {number} limit - 限制量
 * @property {Date} [resetAt] - 重置时间
 * @property {'character'|'token'|'request'} unit - 单位
 */

/**
 * 适配器配置
 * @typedef {Object} AdapterConfig
 * @property {string} [apiKey] - API Key
 * @property {string} [apiSecret] - API Secret
 * @property {string} [endpoint] - API 端点
 * @property {string} [model] - 模型名称
 * @property {number} [temperature] - 温度参数 (AI模型)
 * @property {number} [maxTokens] - 最大Token数
 * @property {number} [timeout] - 超时时间（毫秒）
 * @property {ProxyConfig} [proxy] - 代理配置
 */

/**
 * 代理配置
 * @typedef {Object} ProxyConfig
 * @property {string} host - 代理主机
 * @property {number} port - 代理端口
 * @property {Object} [auth] - 认证信息
 * @property {string} auth.username - 用户名
 * @property {string} auth.password - 密码
 */

/**
 * 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否有效
 * @property {string} [message] - 消息
 * @property {Object} [details] - 详细信息
 */

/**
 * 翻译管理器配置
 * @typedef {Object} TranslationManagerConfig
 * @property {string} primaryProvider - 主要提供商
 * @property {string[]} fallbackProviders - 备用提供商列表
 * @property {Object.<string, AdapterConfig & {enabled: boolean}>} providers - 提供商配置
 * @property {ManagerOptions} options - 管理器选项
 * @property {Object.<string, string>} [languagePairPreferences] - 语言对偏好
 */

/**
 * 管理器选项
 * @typedef {Object} ManagerOptions
 * @property {boolean} autoFallback - 自动降级
 * @property {boolean} cacheResults - 缓存结果
 * @property {boolean} parallelTranslation - 并行翻译
 * @property {number} retryCount - 重试次数
 * @property {number} timeout - 超时时间
 */

// 导出空对象以使其成为模块
export {};
