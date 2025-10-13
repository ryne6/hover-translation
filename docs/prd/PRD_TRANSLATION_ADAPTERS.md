# PRD: 多翻译引擎适配器系统

## 1. 产品概述

### 1.1 背景
当前插件仅支持有限的翻译服务（Google、百度），用户需求多样化，不同翻译服务各有优劣：
- 某些服务在特定语言对上表现更好
- 不同服务的 API 配额和定价不同
- 用户可能已有特定服务的 API Key
- AI 翻译服务（如 OpenAI、Claude）提供更自然的翻译

### 1.2 目标
构建一个灵活、可扩展的多翻译引擎系统，支持主流翻译服务，并使用依赖倒置原则（DIP）设计，便于后续添加新的翻译服务。

### 1.3 目标用户
- 需要高质量翻译的专业用户
- 多语言学习者
- 国际化内容创作者
- 已有特定 API Key 的用户

## 2. 支持的翻译服务

### 2.1 传统翻译服务

#### Google Translate
- **优势**: 支持语言最多（100+），翻译质量稳定
- **API**: Google Cloud Translation API
- **费用**: $20/百万字符
- **限制**: 需要 API Key，有配额限制
- **特点**: 
  - 支持自动语言检测
  - 支持批量翻译
  - 响应速度快

#### Microsoft Translator
- **优势**: 企业级可靠性，支持 90+ 语言
- **API**: Azure Cognitive Services Translator
- **费用**: 前 2M 字符免费，之后 $10/百万字符
- **限制**: 需要 Azure 订阅
- **特点**:
  - 支持文档翻译
  - 支持术语词典
  - 提供翻译质量评分

#### Baidu Translate (百度翻译)
- **优势**: 中文翻译质量高，国内访问快
- **API**: 百度翻译 API
- **费用**: 标准版免费 5万字符/月
- **限制**: 需要 APP ID 和密钥
- **特点**:
  - 对中文支持最好
  - 支持垂直领域翻译
  - 国内用户首选

#### Youdao Translate (有道翻译)
- **优势**: 中英互译质量高
- **API**: 有道智云翻译 API
- **费用**: 免费版 100元体验金
- **限制**: 需要应用ID和密钥
- **特点**:
  - 支持语音翻译
  - 支持图片翻译
  - 教育场景优化

#### DeepL
- **优势**: 翻译质量极高，被认为是最接近人工翻译
- **API**: DeepL API
- **费用**: 免费版 500k 字符/月，Pro $5.49/月起
- **限制**: 支持的语言相对较少（30+）
- **特点**:
  - 翻译质量最高
  - 支持形式化/非形式化风格
  - 特别适合欧洲语言

#### Tencent Translate (腾讯翻译)
- **优势**: 质量稳定，价格便宜
- **API**: 腾讯云机器翻译
- **费用**: 前 5百万字符免费，之后 $7.5/百万字符
- **限制**: 需要腾讯云账号
- **特点**:
  - 性价比高
  - 支持专业术语库
  - 中英互译优秀

### 2.2 AI 大模型翻译服务

#### OpenAI GPT
- **优势**: 理解上下文，翻译最自然，可添加翻译指令
- **API**: OpenAI API (GPT-4/GPT-3.5)
- **费用**: GPT-4 $0.03/1K tokens, GPT-3.5 $0.002/1K tokens
- **限制**: Token 限制，成本相对较高
- **特点**:
  - 可自定义翻译风格
  - 理解语境和文化差异
  - 支持专业术语解释

#### Anthropic Claude
- **优势**: 长文本翻译，上下文理解强
- **API**: Claude API
- **费用**: $11.02/百万 tokens (Claude 3 Sonnet)
- **限制**: 需要申请 API 访问权限
- **特点**:
  - 100K token 上下文窗口
  - 翻译连贯性好
  - 适合长文章翻译

#### Google Gemini
- **优势**: 多模态支持，免费额度高
- **API**: Gemini API
- **费用**: Gemini 1.5 Flash 免费额度很高
- **限制**: 部分地区不可用
- **特点**:
  - 支持图文混合翻译
  - 响应速度快
  - 适合实时场景

#### 讯飞星火 (iFlytek Spark)
- **优势**: 中文理解强，国产可控
- **API**: 讯飞星火认知大模型 API
- **费用**: 新用户免费 token
- **限制**: 需要实名认证
- **特点**:
  - 中文专业术语翻译准确
  - 支持多轮对话式翻译
  - 国产大模型首选

#### 文心一言 (ERNIE Bot)
- **优势**: 百度生态，中文理解深
- **API**: 文心一言 API
- **费用**: 新用户有免费额度
- **限制**: 需要百度云账号
- **特点**:
  - 百度搜索数据加持
  - 中文语义理解强
  - 支持专业领域翻译

#### 通义千问 (Qwen)
- **优势**: 阿里云生态，多语言支持
- **API**: 通义千问 API
- **费用**: 有免费调用额度
- **限制**: 需要阿里云账号
- **特点**:
  - 多语言能力均衡
  - 成本较低
  - 稳定性好

### 2.3 本地/离线翻译

#### LibreTranslate
- **优势**: 开源、免费、隐私保护
- **API**: 自建或公共实例
- **费用**: 完全免费（自建）
- **限制**: 翻译质量一般
- **特点**:
  - 数据不出本地
  - 无 API Key 限制
  - 适合隐私敏感用户

#### Argos Translate
- **优势**: 完全离线，无需网络
- **API**: Python 库 / 本地 API
- **费用**: 完全免费
- **限制**: 需要下载语言模型
- **特点**:
  - 无网络依赖
  - 响应极快
  - 适合受限环境

## 3. 系统架构设计（DIP 原则）

### 3.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                  Translation Manager                │
│  (高层模块，依赖抽象接口，不依赖具体实现)            │
└───────────────────┬─────────────────────────────────┘
                    │ depends on
                    ▼
┌─────────────────────────────────────────────────────┐
│          ITranslationAdapter (抽象接口)              │
│  + translate(text, source, target): Promise         │
│  + detectLanguage(text): Promise                    │
│  + getSupportedLanguages(): Array                   │
│  + validateConfig(): boolean                        │
│  + getProviderInfo(): ProviderInfo                  │
└───────────────────┬─────────────────────────────────┘
                    △ implements
        ┌───────────┴───────────┬───────────┬────────────┬──────────┐
        │                       │           │            │          │
┌───────┴────────┐  ┌──────────┴────┐  ┌──┴──────┐  ┌──┴────┐  ┌──┴────────┐
│ GoogleAdapter  │  │ DeepLAdapter  │  │ OpenAI  │  │ Baidu │  │  Custom   │
│                │  │               │  │ Adapter │  │Adapter│  │  Adapters │
└────────────────┘  └───────────────┘  └─────────┘  └───────┘  └───────────┘
```

### 3.2 核心接口定义

#### ITranslationAdapter（翻译适配器接口）
```typescript
interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  options?: {
    formality?: 'formal' | 'informal';
    context?: string;
    domain?: string;
  };
}

interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
  alternatives?: string[];
  provider: string;
  timestamp: number;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  logo: string;
  supportedLanguages: string[];
  features: string[];
  requiresApiKey: boolean;
  pricing: {
    model: 'free' | 'freemium' | 'paid';
    details: string;
  };
}

interface ITranslationAdapter {
  // 核心翻译方法
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  
  // 语言检测
  detectLanguage(text: string): Promise<string>;
  
  // 获取支持的语言列表
  getSupportedLanguages(): string[];
  
  // 验证配置（如 API Key）
  validateConfig(): Promise<boolean>;
  
  // 获取提供商信息
  getProviderInfo(): ProviderInfo;
  
  // 获取剩余配额（如果适用）
  getQuota?(): Promise<QuotaInfo>;
  
  // 批量翻译（可选）
  batchTranslate?(requests: TranslationRequest[]): Promise<TranslationResponse[]>;
}
```

### 3.3 适配器工厂

```typescript
interface AdapterFactory {
  createAdapter(providerId: string, config: AdapterConfig): ITranslationAdapter;
  registerAdapter(providerId: string, adapterClass: typeof ITranslationAdapter): void;
  getAvailableProviders(): ProviderInfo[];
}
```

### 3.4 翻译管理器

```typescript
class TranslationManager {
  private adapters: Map<string, ITranslationAdapter>;
  private activeProvider: string;
  private fallbackProviders: string[];
  
  // 设置主要翻译服务
  setProvider(providerId: string): void;
  
  // 设置备用服务（主服务失败时自动切换）
  setFallbackProviders(providerIds: string[]): void;
  
  // 智能翻译（自动选择最佳服务）
  async smartTranslate(request: TranslationRequest): Promise<TranslationResponse>;
  
  // 强制使用指定服务
  async translateWith(providerId: string, request: TranslationRequest): Promise<TranslationResponse>;
  
  // 并行翻译（返回多个服务的结果）
  async parallelTranslate(request: TranslationRequest, providerIds: string[]): Promise<TranslationResponse[]>;
}
```

## 4. 功能需求

### 4.1 配置页面功能

#### 4.1.1 翻译服务选择
- [ ] 服务列表展示（图标 + 名称 + 描述）
- [ ] 当前激活状态显示
- [ ] 快速切换按钮
- [ ] 服务分类（传统翻译 / AI 翻译 / 本地翻译）

#### 4.1.2 API 密钥管理
- [ ] 密钥输入框（遮挡显示）
- [ ] 密钥验证按钮
- [ ] 验证状态显示（成功/失败/验证中）
- [ ] 密钥安全存储（加密）
- [ ] 密钥快速复制

#### 4.1.3 高级配置
- [ ] 翻译风格设置（正式/非正式）
- [ ] 专业领域选择（通用/医学/法律/科技等）
- [ ] 上下文窗口大小（AI 模型）
- [ ] 请求超时设置
- [ ] 重试次数配置

#### 4.1.4 备用服务配置
- [ ] 主服务选择
- [ ] 备用服务排序（拖拽排序）
- [ ] 失败自动切换开关
- [ ] 服务健康状态监控

#### 4.1.5 配额监控
- [ ] 当前配额使用情况
- [ ] 配额预警设置
- [ ] 历史使用统计
- [ ] 成本估算

### 4.2 翻译功能增强

#### 4.2.1 智能服务选择
- [ ] 根据语言对自动选择最佳服务
  - 中英互译 → 百度/有道
  - 欧洲语言 → DeepL
  - 长文本 → Claude
  - 专业术语 → OpenAI
- [ ] 根据文本长度选择
  - 短文本（<100 字符）→ 快速服务
  - 长文本（>1000 字符）→ AI 服务
- [ ] 根据配额剩余情况选择

#### 4.2.2 并行翻译
- [ ] 同时调用多个服务
- [ ] 结果对比展示
- [ ] 翻译质量投票
- [ ] 保存最佳翻译

#### 4.2.3 翻译增强
- [ ] 上下文感知翻译（AI 模型）
- [ ] 专业术语词典
- [ ] 翻译记忆（Translation Memory）
- [ ] 自定义翻译规则

### 4.3 错误处理

#### 4.3.1 自动容错
- [ ] 主服务失败 → 自动切换备用服务
- [ ] 请求超时 → 自动重试
- [ ] API 限流 → 等待并重试
- [ ] 配额耗尽 → 切换到其他服务

#### 4.3.2 用户提示
- [ ] 友好的错误提示
- [ ] 服务状态通知
- [ ] 配额预警通知
- [ ] 切换服务提示

## 5. 数据模型

### 5.1 配置存储

```typescript
interface TranslationConfig {
  // 主要服务
  primaryProvider: string;
  
  // 备用服务列表
  fallbackProviders: string[];
  
  // 各服务的配置
  providers: {
    [providerId: string]: {
      enabled: boolean;
      apiKey?: string;
      apiSecret?: string;
      endpoint?: string;
      options?: Record<string, any>;
    };
  };
  
  // 翻译选项
  options: {
    autoFallback: boolean;
    parallelTranslation: boolean;
    cacheResults: boolean;
    retryCount: number;
    timeout: number;
  };
  
  // 语言对偏好（某些语言对优先使用某个服务）
  languagePairPreferences: {
    [pair: string]: string; // "en-zh" => "baidu"
  };
}
```

### 5.2 翻译缓存

```typescript
interface TranslationCache {
  key: string; // hash(text + source + target + provider)
  text: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  provider: string;
  timestamp: number;
  expiresAt: number;
}
```

### 5.3 使用统计

```typescript
interface UsageStats {
  providerId: string;
  date: string;
  requests: number;
  characters: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  cost?: number;
}
```

## 6. 非功能需求

### 6.1 性能
- 翻译响应时间 < 2 秒（95th percentile）
- 缓存命中率 > 30%
- 支持并发请求

### 6.2 安全性
- API Key 加密存储
- 支持代理配置
- 敏感数据不记录日志

### 6.3 可用性
- 主服务故障时自动切换成功率 > 95%
- 配置界面响应时间 < 500ms
- 支持导入/导出配置

### 6.4 可扩展性
- 插件化架构，易于添加新服务
- 适配器接口稳定，向后兼容
- 支持自定义适配器

## 7. 实现优先级

### P0（必须实现）
1. ✅ 适配器接口定义
2. ✅ Google Translate 适配器
3. ✅ Baidu Translate 适配器
4. ✅ DeepL 适配器
5. ✅ OpenAI 适配器
6. ✅ 翻译管理器
7. ✅ 配置页面基础功能
8. ✅ API Key 验证
9. ✅ 服务切换功能

### P1（重要功能）
1. ⏳ Microsoft Translator 适配器
2. ⏳ Youdao Translate 适配器
3. ⏳ 备用服务配置
4. ⏳ 智能服务选择
5. ⏳ 配额监控
6. ⏳ 错误处理和重试

### P2（增强功能）
1. ⏳ Claude 适配器
2. ⏳ Gemini 适配器
3. ⏳ 国产大模型适配器（讯飞、文心、通义）
4. ⏳ 并行翻译
5. ⏳ 翻译对比
6. ⏳ 使用统计

### P3（未来规划）
1. ⏳ 本地翻译（LibreTranslate）
2. ⏳ 自定义适配器支持
3. ⏳ 翻译记忆
4. ⏳ 专业术语词典

## 8. 技术栈

### 8.1 核心技术
- TypeScript（类型安全）
- 依赖注入（DIP 实现）
- 适配器模式
- 工厂模式

### 8.2 工具库
- Axios（HTTP 请求）
- crypto-js（API Key 加密）
- lru-cache（翻译缓存）

## 9. 测试策略

### 9.1 单元测试
- 每个适配器独立测试
- Mock API 响应
- 覆盖率 > 80%

### 9.2 集成测试
- 真实 API 调用测试（使用测试 Key）
- 服务切换测试
- 错误处理测试

### 9.3 性能测试
- 并发翻译测试
- 响应时间测试
- 缓存效果测试

## 10. 发布计划

### Phase 1（v0.2.0）- 2周
- 实现核心适配器接口
- 实现 Google、Baidu、DeepL、OpenAI 四个适配器
- 基础配置页面

### Phase 2（v0.3.0）- 2周
- 添加更多适配器（Microsoft、Youdao）
- 智能服务选择
- 备用服务配置

### Phase 3（v0.4.0）- 2周
- AI 模型适配器（Claude、Gemini、国产大模型）
- 并行翻译功能
- 配额监控

### Phase 4（v0.5.0）- 按需
- 高级功能（翻译记忆、术语词典等）
- 本地翻译支持
- 自定义适配器

## 11. 成功指标

- 支持翻译服务数量 ≥ 10
- 用户服务切换成功率 > 95%
- 配置保存成功率 > 99%
- 翻译质量用户满意度 > 4.0/5.0
- 服务故障自动恢复率 > 90%

---

**文档版本**: v1.0  
**创建日期**: 2025-10-11  
**最后更新**: 2025-10-11  
**负责人**: Development Team
