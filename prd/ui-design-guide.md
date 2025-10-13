# Hover Translation Chrome Extension - UI 设计指南

## 1. 设计理念

### 1.1 核心设计原则
- **优雅的极简主义美学**：去除冗余元素，突出核心功能
- **清新柔和的渐变配色**：营造舒适的视觉体验
- **恰到好处的留白设计**：确保信息层级清晰
- **轻盈通透的沉浸式体验**：不干扰用户正常浏览
- **精心打磨的微交互**：提供流畅的用户体验

### 1.2 视觉风格定位
- **现代简约**：符合当前主流设计趋势
- **科技感**：体现智能翻译的技术特性
- **亲和力**：降低用户使用门槛
- **专业性**：保证翻译功能的可信度

## 2. 色彩系统

### 2.1 主色调
```css
:root {
  /* 主品牌色 - 优雅蓝紫渐变 */
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --primary-dark: #5a6fd8;
  --primary-light: #7c8ef0;
  
  /* 辅助色 - 清新绿色 */
  --secondary-color: #4ecdc4;
  --secondary-light: #6dd5ce;
  --secondary-dark: #3bb5ac;
  
  /* 中性色系 */
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --text-muted: #718096;
  --text-inverse: #ffffff;
  
  /* 背景色系 */
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --bg-tertiary: #edf2f7;
  --bg-overlay: rgba(255, 255, 255, 0.95);
  
  /* 边框和分割线 */
  --border-light: #e2e8f0;
  --border-medium: #cbd5e0;
  --border-dark: #a0aec0;
  
  /* 状态色 */
  --success-color: #48bb78;
  --warning-color: #ed8936;
  --error-color: #f56565;
  --info-color: #4299e1;
}
```

### 2.2 深色主题
```css
[data-theme="dark"] {
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
  --text-muted: #a0aec0;
  --text-inverse: #2d3748;
  
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-tertiary: #4a5568;
  --bg-overlay: rgba(26, 32, 44, 0.95);
  
  --border-light: #4a5568;
  --border-medium: #718096;
  --border-dark: #a0aec0;
}
```

## 3. 字体系统

### 3.1 字体选择
```css
:root {
  /* 主字体 - 现代无衬线字体 */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                  'Helvetica Neue', Arial, sans-serif;
  
  /* 等宽字体 - 用于代码或特殊内容 */
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 
               'Source Code Pro', monospace;
  
  /* 字体大小系统 */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  
  /* 行高系统 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### 3.2 字体权重
```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## 4. 间距系统

### 4.1 间距规范
```css
:root {
  /* 基础间距单位 - 4px 网格系统 */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

## 5. 圆角系统

### 5.1 圆角规范
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

## 6. 阴影系统

### 6.1 阴影规范
```css
:root {
  /* 基础阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 特殊阴影 */
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-outline: 0 0 0 3px rgba(102, 126, 234, 0.5);
  --shadow-focus: 0 0 0 3px rgba(102, 126, 234, 0.3);
}
```

## 7. 组件设计规范

### 7.1 悬浮翻译框

#### 7.1.1 基础结构
```html
<div class="hover-translation-box">
  <div class="translation-header">
    <div class="language-indicator">
      <span class="source-lang">EN</span>
      <div class="arrow-icon">→</div>
      <span class="target-lang">中文</span>
    </div>
    <div class="action-buttons">
      <button class="btn-icon copy-btn" title="复制翻译">
        <svg>...</svg>
      </button>
      <button class="btn-icon sound-btn" title="发音">
        <svg>...</svg>
      </button>
      <button class="btn-icon close-btn" title="关闭">
        <svg>...</svg>
      </button>
    </div>
  </div>
  
  <div class="translation-content">
    <div class="original-text">
      <span class="text-label">原文</span>
      <p class="text-content">Hello World</p>
    </div>
    <div class="translated-text">
      <span class="text-label">译文</span>
      <p class="text-content">你好世界</p>
    </div>
  </div>
  
  <div class="translation-footer">
    <div class="provider-info">由 Google 翻译提供</div>
  </div>
</div>
```

#### 7.1.2 样式定义
```css
.hover-translation-box {
  position: absolute;
  z-index: 10000;
  min-width: 280px;
  max-width: 400px;
  background: var(--bg-overlay);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-translation-box.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.translation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.language-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.arrow-icon {
  color: var(--primary-color);
  font-weight: var(--font-bold);
}

.action-buttons {
  display: flex;
  gap: var(--space-1);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.translation-content {
  padding: var(--space-4);
}

.original-text,
.translated-text {
  margin-bottom: var(--space-3);
}

.original-text:last-child,
.translated-text:last-child {
  margin-bottom: 0;
}

.text-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  margin-bottom: var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-content {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
  word-break: break-word;
}

.translated-text .text-content {
  font-weight: var(--font-medium);
  color: var(--primary-color);
}

.translation-footer {
  padding: var(--space-2) var(--space-4);
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

.provider-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}
```

### 7.2 设置弹窗

#### 7.2.1 弹窗结构
```html
<div class="popup-container">
  <header class="popup-header">
    <h1 class="popup-title">Hover Translation</h1>
    <div class="popup-version">v1.0.0</div>
  </header>
  
  <main class="popup-content">
    <section class="settings-section">
      <h2 class="section-title">翻译设置</h2>
      
      <div class="setting-item">
        <label class="setting-label">目标语言</label>
        <select class="setting-select">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      
      <div class="setting-item">
        <label class="setting-label">翻译服务</label>
        <div class="radio-group">
          <label class="radio-item">
            <input type="radio" name="provider" value="google" checked>
            <span class="radio-label">Google 翻译</span>
          </label>
          <label class="radio-item">
            <input type="radio" name="provider" value="baidu">
            <span class="radio-label">百度翻译</span>
          </label>
        </div>
      </div>
    </section>
    
    <section class="settings-section">
      <h2 class="section-title">界面设置</h2>
      
      <div class="setting-item">
        <label class="setting-label">主题</label>
        <div class="theme-switch">
          <button class="theme-btn active" data-theme="light">
            <span class="theme-icon">☀️</span>
            <span class="theme-name">浅色</span>
          </button>
          <button class="theme-btn" data-theme="dark">
            <span class="theme-icon">🌙</span>
            <span class="theme-name">深色</span>
          </button>
        </div>
      </div>
    </section>
  </main>
  
  <footer class="popup-footer">
    <button class="btn-primary">保存设置</button>
    <button class="btn-secondary">重置</button>
  </footer>
</div>
```

#### 7.2.2 弹窗样式
```css
.popup-container {
  width: 360px;
  min-height: 500px;
  background: var(--bg-primary);
  font-family: var(--font-primary);
  color: var(--text-primary);
}

.popup-header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  text-align: center;
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.popup-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-1);
}

.popup-version {
  font-size: var(--text-sm);
  opacity: 0.8;
}

.popup-content {
  padding: var(--space-6);
}

.settings-section {
  margin-bottom: var(--space-8);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.setting-item {
  margin-bottom: var(--space-5);
}

.setting-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.setting-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: border-color 0.15s ease;
}

.setting-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-focus);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.radio-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.radio-item input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

.radio-label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.theme-switch {
  display: flex;
  gap: var(--space-2);
}

.theme-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-btn:hover {
  border-color: var(--primary-color);
}

.theme-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--text-inverse);
}

.theme-icon {
  font-size: var(--text-lg);
}

.theme-name {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.popup-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: var(--space-3);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}
```

## 8. 动画效果

### 8.1 进入动画
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hover-translation-box.show {
  animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 8.2 微交互
```css
.btn-icon {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-icon:active {
  transform: scale(0.95);
}

.setting-select:focus {
  transition: all 0.15s ease;
}

.theme-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-btn:active {
  transform: scale(0.98);
}
```

## 9. 响应式设计

### 9.1 断点系统
```css
:root {
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

@media (max-width: 480px) {
  .hover-translation-box {
    min-width: 240px;
    max-width: calc(100vw - 32px);
  }
  
  .popup-container {
    width: 320px;
  }
}
```

## 10. 无障碍设计

### 10.1 可访问性规范
```css
/* 焦点状态 */
.btn-icon:focus,
.setting-select:focus,
.theme-btn:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  :root {
    --border-light: #000000;
    --text-muted: #000000;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10.2 语义化标签
```html
<!-- 使用语义化标签 -->
<button aria-label="复制翻译结果" class="btn-icon copy-btn">
  <svg aria-hidden="true">...</svg>
</button>

<select aria-label="选择目标语言" class="setting-select">
  <!-- options -->
</select>
```
