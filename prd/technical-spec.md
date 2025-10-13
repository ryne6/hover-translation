# Hover Translation Chrome Extension - 技术规格文档

## 1. 技术架构

### 1.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content Script │    │ Background Script│    │   Popup UI      │
│                 │    │                 │    │                 │
│ - 文字选择监听   │◄──►│ - API 调用管理   │◄──►│ - 设置界面       │
│ - 悬浮框显示     │    │ - 数据存储管理   │    │ - 历史记录       │
│ - 用户交互处理   │    │ - 翻译服务调用   │    │ - 状态显示       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Translation API │
                    │                 │
                    │ - Google Translate│
                    │ - 百度翻译 API   │
                    │ - 备用翻译服务   │
                    └─────────────────┘
```

### 1.2 技术栈选择

#### 1.2.1 核心技术
- **Manifest V3**：使用最新的 Chrome 扩展标准
- **JavaScript ES6+**：现代 JavaScript 语法
- **CSS3**：使用 Grid、Flexbox、CSS Variables
- **HTML5**：语义化标签和现代 HTML 特性

#### 1.2.2 开发工具
- **构建工具**：Webpack 5 + Babel
- **代码规范**：ESLint + Prettier
- **测试框架**：Jest + Chrome Extension Testing
- **版本控制**：Git + Conventional Commits

## 2. 文件结构

```
hover-translation/
├── manifest.json              # 扩展清单文件
├── package.json               # 项目配置
├── webpack.config.js          # 构建配置
├── src/
│   ├── background/
│   │   ├── background.js      # 后台脚本
│   │   └── api-manager.js     # API 管理
│   ├── content/
│   │   ├── content.js         # 内容脚本主文件
│   │   ├── text-selector.js   # 文字选择处理
│   │   ├── hover-box.js       # 悬浮框组件
│   │   └── position-utils.js  # 定位工具
│   ├── popup/
│   │   ├── popup.html         # 弹窗页面
│   │   ├── popup.js           # 弹窗逻辑
│   │   ├── popup.css          # 弹窗样式
│   │   └── settings.js        # 设置管理
│   ├── shared/
│   │   ├── constants.js       # 常量定义
│   │   ├── utils.js           # 工具函数
│   │   ├── storage.js         # 存储管理
│   │   └── language-detector.js # 语言检测
│   └── styles/
│       ├── variables.css      # CSS 变量
│       ├── hover-box.css      # 悬浮框样式
│       └── animations.css     # 动画效果
├── assets/
│   ├── icons/                 # 图标资源
│   └── images/                # 图片资源
├── tests/                     # 测试文件
└── docs/                      # 文档
```

## 3. 核心模块设计

### 3.1 Content Script 模块

#### 3.1.1 文字选择监听器
```javascript
class TextSelector {
  constructor() {
    this.selectedText = '';
    this.selectionRange = null;
    this.isSelecting = false;
  }

  // 监听文字选择事件
  initSelectionListener() {
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('keyup', this.handleTextSelection.bind(this));
  }

  // 处理文字选择
  handleTextSelection(event) {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text !== this.selectedText) {
      this.selectedText = text;
      this.selectionRange = selection.getRangeAt(0);
      this.triggerTranslation(text);
    }
  }
}
```

#### 3.1.2 悬浮框组件
```javascript
class HoverBox {
  constructor() {
    this.box = null;
    this.isVisible = false;
    this.position = { x: 0, y: 0 };
  }

  // 创建悬浮框
  createBox() {
    this.box = document.createElement('div');
    this.box.className = 'hover-translation-box';
    this.box.innerHTML = this.getBoxTemplate();
    document.body.appendChild(this.box);
  }

  // 显示翻译结果
  showTranslation(originalText, translatedText, sourceLang, targetLang) {
    this.updateContent(originalText, translatedText, sourceLang, targetLang);
    this.positionBox();
    this.show();
  }

  // 智能定位
  positionBox() {
    const rect = this.selectionRange.getBoundingClientRect();
    const boxRect = this.box.getBoundingClientRect();
    
    // 计算最佳位置，避免超出视窗
    this.position = this.calculateOptimalPosition(rect, boxRect);
    this.box.style.left = `${this.position.x}px`;
    this.box.style.top = `${this.position.y}px`;
  }
}
```

### 3.2 Background Script 模块

#### 3.2.1 API 管理器
```javascript
class APIManager {
  constructor() {
    this.providers = {
      google: new GoogleTranslateAPI(),
      baidu: new BaiduTranslateAPI(),
      fallback: new FallbackTranslateAPI()
    };
    this.currentProvider = 'google';
  }

  // 翻译文本
  async translateText(text, sourceLang, targetLang) {
    try {
      const result = await this.providers[this.currentProvider]
        .translate(text, sourceLang, targetLang);
      return result;
    } catch (error) {
      console.warn('Primary provider failed, trying fallback');
      return await this.providers.fallback.translate(text, sourceLang, targetLang);
    }
  }

  // 检测语言
  async detectLanguage(text) {
    return await this.providers[this.currentProvider].detect(text);
  }
}
```

#### 3.2.2 存储管理器
```javascript
class StorageManager {
  constructor() {
    this.defaultSettings = {
      targetLanguage: 'zh-CN',
      sourceLanguage: 'auto',
      translationProvider: 'google',
      theme: 'light',
      shortcuts: {
        toggle: 'Ctrl+Shift+T',
        copy: 'Ctrl+C'
      }
    };
  }

  // 获取设置
  async getSettings() {
    const result = await chrome.storage.sync.get(this.defaultSettings);
    return result;
  }

  // 保存设置
  async saveSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  // 获取翻译历史
  async getHistory() {
    const result = await chrome.storage.local.get(['translationHistory']);
    return result.translationHistory || [];
  }

  // 保存翻译记录
  async saveTranslation(original, translated, sourceLang, targetLang) {
    const history = await this.getHistory();
    const newRecord = {
      id: Date.now(),
      original,
      translated,
      sourceLang,
      targetLang,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(newRecord);
    // 只保留最近 100 条记录
    if (history.length > 100) {
      history.splice(100);
    }
    
    await chrome.storage.local.set({ translationHistory: history });
  }
}
```

### 3.3 语言检测模块

```javascript
class LanguageDetector {
  constructor() {
    this.languagePatterns = {
      'zh-CN': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ar': /[\u0600-\u06ff]/,
      'ru': /[\u0400-\u04ff]/,
      'en': /^[a-zA-Z\s]+$/
    };
  }

  // 检测文本语言
  detectLanguage(text) {
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    return 'auto';
  }

  // 智能选择翻译方向
  getTranslationDirection(detectedLang, userTargetLang) {
    if (detectedLang === userTargetLang) {
      return null; // 不需要翻译
    }
    
    return {
      source: detectedLang,
      target: userTargetLang
    };
  }
}
```

## 4. API 集成

### 4.1 Google Translate API
```javascript
class GoogleTranslateAPI {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  }

  async translate(text, sourceLang, targetLang) {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    const data = await response.json();
    return {
      translatedText: data.data.translations[0].translatedText,
      detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage
    };
  }
}
```

### 4.2 百度翻译 API
```javascript
class BaiduTranslateAPI {
  constructor() {
    this.appId = process.env.BAIDU_APP_ID;
    this.secretKey = process.env.BAIDU_SECRET_KEY;
    this.baseUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  }

  async translate(text, sourceLang, targetLang) {
    const salt = Date.now();
    const sign = this.generateSign(text, salt);
    
    const params = new URLSearchParams({
      q: text,
      from: sourceLang,
      to: targetLang,
      appid: this.appId,
      salt: salt,
      sign: sign
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json();
    
    return {
      translatedText: data.trans_result[0].dst,
      detectedSourceLanguage: data.from
    };
  }
}
```

## 5. 性能优化

### 5.1 防抖和节流
```javascript
// 文字选择防抖
const debounceSelection = debounce((text) => {
  this.triggerTranslation(text);
}, 300);

// API 调用节流
const throttleAPI = throttle(async (text) => {
  return await this.translateText(text);
}, 1000);
```

### 5.2 缓存策略
```javascript
class TranslationCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
  }

  get(text, sourceLang, targetLang) {
    const key = `${text}_${sourceLang}_${targetLang}`;
    return this.cache.get(key);
  }

  set(text, sourceLang, targetLang, result) {
    const key = `${text}_${sourceLang}_${targetLang}`;
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
}
```

### 5.3 内存管理
```javascript
// 清理事件监听器
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.set(`${element}_${event}`, { element, event, handler });
  }

  removeAllListeners() {
    for (const [key, { element, event, handler }] of this.listeners) {
      element.removeEventListener(event, handler);
    }
    this.listeners.clear();
  }
}
```

## 6. 安全考虑

### 6.1 权限最小化
```json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://translation.googleapis.com/*",
    "https://fanyi-api.baidu.com/*"
  ]
}
```

### 6.2 数据安全
```javascript
// 敏感数据加密
class DataEncryption {
  static encrypt(text) {
    // 使用 Web Crypto API 加密敏感数据
    return crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12) },
      this.key,
      new TextEncoder().encode(text)
    );
  }
}
```

## 7. 测试策略

### 7.1 单元测试
```javascript
// Jest 测试示例
describe('TextSelector', () => {
  test('should detect text selection', () => {
    const selector = new TextSelector();
    const mockSelection = {
      toString: () => 'Hello World',
      getRangeAt: () => ({ getBoundingClientRect: () => ({}) })
    };
    
    window.getSelection = () => mockSelection;
    selector.handleTextSelection();
    
    expect(selector.selectedText).toBe('Hello World');
  });
});
```

### 7.2 集成测试
```javascript
// Chrome Extension 测试
describe('Extension Integration', () => {
  test('should show translation box on text selection', async () => {
    // 模拟文字选择
    // 验证悬浮框显示
    // 检查翻译结果
  });
});
```

## 8. 部署和发布

### 8.1 构建流程
```json
{
  "scripts": {
    "build": "webpack --mode=production",
    "dev": "webpack --mode=development --watch",
    "test": "jest",
    "lint": "eslint src/",
    "package": "npm run build && zip -r hover-translation.zip dist/"
  }
}
```

### 8.2 版本管理
- 使用语义化版本号 (Semantic Versioning)
- 自动化版本发布流程
- Chrome Web Store 发布检查清单
