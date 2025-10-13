# Hover Translation Chrome Extension - 实施计划

## 1. 项目概述

### 1.1 项目目标
开发一个优雅、智能的 Chrome 浏览器翻译插件，提供悬停翻译功能，让用户能够无缝地翻译网页上的任意文字。

### 1.2 开发周期
- **总开发时间**：12 周
- **团队规模**：1-2 名开发者
- **发布计划**：分阶段发布（MVP → 完整版 → 优化版）

## 2. 开发阶段规划

### 2.1 第一阶段：MVP 版本（第 1-4 周）

#### 2.1.1 第 1 周：项目初始化
**目标**：搭建项目基础架构

**任务清单**：
- [ ] 创建项目目录结构
- [ ] 配置开发环境（Webpack, Babel, ESLint）
- [ ] 设置 Git 仓库和版本控制
- [ ] 创建基础 manifest.json
- [ ] 配置构建脚本

**交付物**：
- 完整的项目结构
- 可运行的开发环境
- 基础构建配置

**技术要点**：
```json
// manifest.json 基础配置
{
  "manifest_version": 3,
  "name": "Hover Translation",
  "version": "0.1.0",
  "description": "智能悬停翻译插件",
  "permissions": ["storage", "activeTab"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

#### 2.1.2 第 2 周：核心功能开发
**目标**：实现基础的文字选择和翻译功能

**任务清单**：
- [ ] 实现文字选择监听器
- [ ] 创建基础悬浮框组件
- [ ] 集成 Google Translate API
- [ ] 实现基础翻译逻辑
- [ ] 添加简单的错误处理

**交付物**：
- 可工作的文字选择功能
- 基础悬浮翻译框
- API 集成代码

**核心代码结构**：
```javascript
// content.js - 主入口
class HoverTranslation {
  constructor() {
    this.textSelector = new TextSelector();
    this.hoverBox = new HoverBox();
    this.apiManager = new APIManager();
  }

  init() {
    this.textSelector.onSelection((text) => {
      this.translateAndShow(text);
    });
  }

  async translateAndShow(text) {
    try {
      const result = await this.apiManager.translate(text);
      this.hoverBox.show(result);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }
}
```

#### 2.1.3 第 3 周：UI 优化和交互
**目标**：完善用户界面和交互体验

**任务清单**：
- [ ] 实现优雅的悬浮框设计
- [ ] 添加动画效果
- [ ] 实现智能定位算法
- [ ] 添加基础操作按钮（复制、关闭）
- [ ] 优化响应式设计

**交付物**：
- 完整的 UI 组件
- 流畅的动画效果
- 智能定位功能

**UI 组件示例**：
```css
.hover-translation-box {
  position: absolute;
  z-index: 10000;
  min-width: 280px;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-translation-box.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

#### 2.1.4 第 4 周：测试和优化
**目标**：完善 MVP 版本，准备发布

**任务清单**：
- [ ] 编写单元测试
- [ ] 进行集成测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 准备发布包

**交付物**：
- 完整的 MVP 版本
- 测试报告
- 发布包

### 2.2 第二阶段：完整版本（第 5-8 周）

#### 2.2.1 第 5 周：设置功能开发
**目标**：实现用户设置和配置功能

**任务清单**：
- [ ] 创建设置弹窗界面
- [ ] 实现语言偏好设置
- [ ] 添加翻译服务选择
- [ ] 实现主题切换功能
- [ ] 添加快捷键配置

**交付物**：
- 完整的设置界面
- 用户偏好管理
- 主题系统

#### 2.2.2 第 6 周：高级功能
**目标**：添加高级翻译功能

**任务清单**：
- [ ] 实现语言自动检测
- [ ] 添加多个翻译服务支持
- [ ] 实现翻译历史记录
- [ ] 添加收藏功能
- [ ] 实现发音功能

**交付物**：
- 智能语言检测
- 多服务支持
- 历史记录系统

#### 2.2.3 第 7 周：数据管理
**目标**：完善数据存储和管理

**任务清单**：
- [ ] 实现本地数据存储
- [ ] 添加数据同步功能
- [ ] 实现数据导出/导入
- [ ] 添加缓存机制
- [ ] 优化存储性能

**交付物**：
- 完整的数据管理系统
- 缓存优化
- 数据同步功能

#### 2.2.4 第 8 周：集成测试
**目标**：全面测试和优化

**任务清单**：
- [ ] 端到端测试
- [ ] 性能基准测试
- [ ] 兼容性测试
- [ ] 用户体验测试
- [ ] 安全审计

**交付物**：
- 完整的测试报告
- 性能优化报告
- 安全审计报告

### 2.3 第三阶段：优化版本（第 9-12 周）

#### 2.3.1 第 9-10 周：用户体验优化
**目标**：提升用户体验和界面美观度

**任务清单**：
- [ ] 界面设计优化
- [ ] 动画效果完善
- [ ] 交互流程优化
- [ ] 无障碍功能增强
- [ ] 多语言界面支持

**交付物**：
- 优化的用户界面
- 完善的动画系统
- 无障碍功能

#### 2.3.2 第 11 周：高级特性
**目标**：添加高级特性和功能

**任务清单**：
- [ ] 实现离线翻译
- [ ] 添加专业术语支持
- [ ] 实现批量翻译
- [ ] 添加翻译质量评估
- [ ] 实现智能推荐

**交付物**：
- 离线翻译功能
- 专业术语库
- 智能推荐系统

#### 2.3.3 第 12 周：发布准备
**目标**：准备正式发布

**任务清单**：
- [ ] 最终测试和修复
- [ ] 文档完善
- [ ] 发布包准备
- [ ] Chrome Web Store 提交
- [ ] 用户反馈收集

**交付物**：
- 最终发布版本
- 完整文档
- 发布包

## 3. 技术实施细节

### 3.1 开发环境配置

#### 3.1.1 项目初始化
```bash
# 创建项目目录
mkdir hover-translation
cd hover-translation

# 初始化 npm 项目
npm init -y

# 安装开发依赖
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env
npm install --save-dev eslint prettier jest
npm install --save-dev copy-webpack-plugin html-webpack-plugin

# 安装生产依赖
npm install --save axios
```

#### 3.1.2 Webpack 配置
```javascript
// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content/content.js',
    background: './src/background/background.js',
    popup: './src/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/styles', to: 'styles' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ],
  mode: 'development',
  devtool: 'source-map'
};
```

### 3.2 核心模块实现

#### 3.2.1 文字选择监听器
```javascript
// src/content/text-selector.js
export class TextSelector {
  constructor() {
    this.selectedText = '';
    this.selectionRange = null;
    this.isSelecting = false;
    this.debounceTimer = null;
  }

  init() {
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('keyup', this.handleTextSelection.bind(this));
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  handleTextSelection(event) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processSelection();
    }, 100);
  }

  handleSelectionChange() {
    if (window.getSelection().toString().trim() === '') {
      this.clearSelection();
    }
  }

  processSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text !== this.selectedText && text.length > 0) {
      this.selectedText = text;
      this.selectionRange = selection.getRangeAt(0);
      this.triggerSelectionEvent(text);
    }
  }

  triggerSelectionEvent(text) {
    const event = new CustomEvent('textSelected', {
      detail: {
        text: text,
        range: this.selectionRange
      }
    });
    document.dispatchEvent(event);
  }

  clearSelection() {
    this.selectedText = '';
    this.selectionRange = null;
    const event = new CustomEvent('selectionCleared');
    document.dispatchEvent(event);
  }
}
```

#### 3.2.2 悬浮框组件
```javascript
// src/content/hover-box.js
export class HoverBox {
  constructor() {
    this.box = null;
    this.isVisible = false;
    this.position = { x: 0, y: 0 };
    this.currentRange = null;
  }

  create() {
    if (this.box) return;
    
    this.box = document.createElement('div');
    this.box.className = 'hover-translation-box';
    this.box.innerHTML = this.getTemplate();
    document.body.appendChild(this.box);
    
    this.addEventListeners();
  }

  getTemplate() {
    return `
      <div class="translation-header">
        <div class="language-indicator">
          <span class="source-lang">EN</span>
          <div class="arrow-icon">→</div>
          <span class="target-lang">中文</span>
        </div>
        <div class="action-buttons">
          <button class="btn-icon copy-btn" title="复制翻译">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
          <button class="btn-icon close-btn" title="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="translation-content">
        <div class="original-text">
          <span class="text-label">原文</span>
          <p class="text-content original"></p>
        </div>
        <div class="translated-text">
          <span class="text-label">译文</span>
          <p class="text-content translated"></p>
        </div>
      </div>
      <div class="translation-footer">
        <div class="provider-info">由 Google 翻译提供</div>
      </div>
    `;
  }

  show(translationData) {
    if (!this.box) this.create();
    
    this.updateContent(translationData);
    this.positionBox();
    this.animateIn();
  }

  updateContent(data) {
    const originalText = this.box.querySelector('.text-content.original');
    const translatedText = this.box.querySelector('.text-content.translated');
    const sourceLang = this.box.querySelector('.source-lang');
    const targetLang = this.box.querySelector('.target-lang');
    const provider = this.box.querySelector('.provider-info');
    
    originalText.textContent = data.original;
    translatedText.textContent = data.translated;
    sourceLang.textContent = data.sourceLang.toUpperCase();
    targetLang.textContent = this.getLanguageName(data.targetLang);
    provider.textContent = `由 ${data.provider} 提供`;
  }

  positionBox() {
    if (!this.currentRange) return;
    
    const rect = this.currentRange.getBoundingClientRect();
    const boxRect = this.box.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY + 8;
    
    // 水平位置调整
    if (x + boxRect.width > viewport.width) {
      x = viewport.width - boxRect.width - 16;
    }
    if (x < 16) {
      x = 16;
    }
    
    // 垂直位置调整
    if (y + boxRect.height > viewport.height + window.scrollY) {
      y = rect.top + window.scrollY - boxRect.height - 8;
    }
    
    this.box.style.left = `${x}px`;
    this.box.style.top = `${y}px`;
  }

  animateIn() {
    this.box.classList.add('show');
    this.isVisible = true;
  }

  hide() {
    if (!this.box || !this.isVisible) return;
    
    this.box.classList.remove('show');
    this.isVisible = false;
    
    setTimeout(() => {
      if (!this.isVisible) {
        this.box.style.display = 'none';
      }
    }, 200);
  }

  addEventListeners() {
    // 复制按钮
    this.box.querySelector('.copy-btn').addEventListener('click', () => {
      this.copyToClipboard();
    });
    
    // 关闭按钮
    this.box.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.box.contains(e.target) && this.isVisible) {
        this.hide();
      }
    });
  }

  copyToClipboard() {
    const translatedText = this.box.querySelector('.text-content.translated').textContent;
    navigator.clipboard.writeText(translatedText).then(() => {
      // 显示复制成功提示
      this.showCopySuccess();
    });
  }

  showCopySuccess() {
    const btn = this.box.querySelector('.copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    btn.style.color = '#48bb78';
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = '';
    }, 2000);
  }

  getLanguageName(code) {
    const languages = {
      'zh-CN': '中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
      'ru': 'Русский'
    };
    return languages[code] || code.toUpperCase();
  }
}
```

### 3.3 API 集成

#### 3.3.1 API 管理器
```javascript
// src/background/api-manager.js
export class APIManager {
  constructor() {
    this.providers = {
      google: new GoogleTranslateAPI(),
      baidu: new BaiduTranslateAPI()
    };
    this.currentProvider = 'google';
    this.cache = new Map();
  }

  async translate(text, sourceLang = 'auto', targetLang = 'zh-CN') {
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const result = await this.providers[this.currentProvider].translate(text, sourceLang, targetLang);
      
      // 缓存结果
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  async detectLanguage(text) {
    try {
      return await this.providers[this.currentProvider].detect(text);
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'auto';
    }
  }

  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
    }
  }
}
```

## 4. 测试策略

### 4.1 单元测试
```javascript
// tests/text-selector.test.js
import { TextSelector } from '../src/content/text-selector.js';

describe('TextSelector', () => {
  let textSelector;
  
  beforeEach(() => {
    textSelector = new TextSelector();
    document.body.innerHTML = '<p>Hello World</p>';
  });
  
  test('should detect text selection', () => {
    const p = document.querySelector('p');
    const range = document.createRange();
    range.selectNodeContents(p);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    textSelector.processSelection();
    
    expect(textSelector.selectedText).toBe('Hello World');
  });
  
  test('should trigger selection event', (done) => {
    document.addEventListener('textSelected', (event) => {
      expect(event.detail.text).toBe('Hello World');
      done();
    });
    
    // 模拟选择
    textSelector.selectedText = 'Hello World';
    textSelector.triggerSelectionEvent('Hello World');
  });
});
```

### 4.2 集成测试
```javascript
// tests/integration.test.js
describe('Hover Translation Integration', () => {
  test('should show translation box on text selection', async () => {
    // 模拟 API 响应
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          data: {
            translations: [{
              translatedText: '你好世界',
              detectedSourceLanguage: 'en'
            }]
          }
        })
      })
    );
    
    // 创建组件
    const hoverTranslation = new HoverTranslation();
    hoverTranslation.init();
    
    // 模拟文字选择
    const event = new CustomEvent('textSelected', {
      detail: { text: 'Hello World' }
    });
    document.dispatchEvent(event);
    
    // 等待翻译完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证悬浮框显示
    const box = document.querySelector('.hover-translation-box');
    expect(box).toBeTruthy();
    expect(box.classList.contains('show')).toBe(true);
  });
});
```

## 5. 部署和发布

### 5.1 构建脚本
```json
{
  "scripts": {
    "dev": "webpack --mode=development --watch",
    "build": "webpack --mode=production",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "package": "npm run build && zip -r hover-translation.zip dist/",
    "clean": "rm -rf dist/"
  }
}
```

### 5.2 发布检查清单
- [ ] 所有功能测试通过
- [ ] 性能指标达标
- [ ] 安全审计通过
- [ ] 文档完整
- [ ] 图标和资源文件准备
- [ ] Chrome Web Store 描述和截图
- [ ] 隐私政策准备
- [ ] 用户协议准备

## 6. 风险管理和应对

### 6.1 技术风险
**风险**：API 调用限制和费用
**应对**：
- 实现多 API 提供商支持
- 添加缓存机制减少 API 调用
- 设置合理的调用频率限制

**风险**：性能问题
**应对**：
- 实现防抖和节流
- 优化 DOM 操作
- 使用虚拟滚动（如果需要）

### 6.2 产品风险
**风险**：用户接受度
**应对**：
- 进行用户测试
- 收集反馈并快速迭代
- 提供详细的使用说明

**风险**：竞品压力
**应对**：
- 专注差异化功能
- 提供更好的用户体验
- 建立用户社区

## 7. 成功指标

### 7.1 技术指标
- 翻译响应时间 < 200ms
- 插件崩溃率 < 0.1%
- API 调用成功率 > 99%
- 内存使用 < 50MB

### 7.2 产品指标
- 日活跃用户 > 80%
- 用户满意度 > 90%
- 翻译准确率 > 95%
- 用户留存率 > 70%

## 8. 后续规划

### 8.1 功能扩展
- 支持更多翻译服务
- 添加离线翻译功能
- 实现批量翻译
- 支持专业术语翻译

### 8.2 平台扩展
- 开发 Firefox 版本
- 开发 Safari 版本
- 开发 Edge 版本
- 开发移动端应用

### 8.3 商业化
- 高级功能付费版本
- 企业级解决方案
- API 服务提供
- 数据分析和洞察服务
