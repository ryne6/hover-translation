/**
 * Hover Box 样式常量
 * 用于 Shadow DOM 中的样式注入
 */

/**
 * CSS 变量定义
 * 在 Shadow DOM 中重新定义所需的 CSS 变量
 */
export const CSS_VARIABLES = `
:host {
  /* 颜色变量 */
  --primary-color: #3b82f6;
  --success-color: #48bb78;
  --error-color: #ef4444;
  
  /* 文本颜色 */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* 背景颜色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-overlay: #ffffff;
  
  /* 边框颜色 */
  --border-light: #e5e7eb;
  
  /* 按钮颜色 */
  --button-border: #d1d5db;
  --button-hover-bg: #f3f4f6;
  
  /* 阴影 */
  --shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 圆角 */
  --radius-base: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  
  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  
  /* 字体 */
  --font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: 'Courier New', Courier, monospace;
  --text-xs: 11px;
  --text-sm: 14px;
  --font-medium: 500;
  
  /* 行高 */
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* 过渡 */
  --duration-fast: 0.15s;
  --duration-normal: 0.2s;
  --duration-slow: 0.3s;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 暗色主题变量 */
@media (prefers-color-scheme: dark) {
  :host {
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-muted: #9ca3af;
    
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --bg-overlay: #1f2937;
    
    --border-light: #374151;
    
    --button-border: #4b5563;
    --button-hover-bg: #374151;
  }
}
`;

/**
 * Hover Box 主样式
 */
export const HOVER_BOX_STYLES = `
/* 悬浮翻译框基础样式 */
.hover-translation-box {
  position: relative;
  min-width: 280px;
  max-width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all var(--duration-normal) var(--ease-out);
  pointer-events: auto;
  user-select: text;
  isolation: isolate;
}

.hover-translation-box.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 头部区域 */
.translation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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
  color: var(--text-muted);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
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
  border: 1px solid var(--button-border);
  background: var(--bg-primary);
  border-radius: var(--radius-base);
  color: var(--button-border);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  outline: none;
}

.btn-icon__icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  background-color: currentColor;
  mask: var(--icon-url) center / contain no-repeat;
  -webkit-mask: var(--icon-url) center / contain no-repeat;
}

.btn-icon:hover {
  background: var(--button-hover-bg);
  color: var(--primary-color);
}

.sound-btn.is-speaking {
  background: var(--button-hover-bg);
  color: var(--primary-color);
  box-shadow: none;
}

.btn-icon:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(85, 85, 85, 0.15);
}

.btn-icon:active {
  transform: scale(0.95);
}

/* 内容区域 */
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
  white-space: pre-wrap;
}

.translated-text .text-content {
  font-weight: var(--font-medium);
  color: #000000;
}

.pronunciation-section {
  margin-top: var(--space-3);
}

.pronunciation-loading,
.pronunciation-error {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.pronunciation-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.pronunciation-item:first-child {
  margin-top: var(--space-1);
}

.ipa-text {
  font-family: var(--font-mono, 'Courier New', Courier, monospace);
  color: var(--text-muted);
}

.ipa-button,
.pronounce-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--button-border);
  border-radius: var(--radius-base);
  background: var(--bg-primary);
  color: var(--button-border);
  padding: 6px 12px;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}

.ipa-button:hover,
.ipa-button.is-speaking,
.pronounce-btn:hover,
.pronounce-btn.is-speaking {
  background: var(--button-hover-bg);
  color: var(--primary-color);
}

/* 底部区域 */
.translation-footer {
  padding: var(--space-2) var(--space-4);
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.provider-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border-light);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .hover-translation-box {
    min-width: 240px;
    max-width: calc(100vw - 32px);
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .hover-translation-box {
    background: var(--bg-overlay);
    border-color: var(--border-light);
  }

  .translation-header,
  .translation-footer {
    background: var(--bg-secondary);
    border-color: var(--border-light);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .hover-translation-box {
    border: 2px solid var(--text-primary);
    box-shadow: var(--shadow-xl), 0 0 0 1px var(--text-primary);
  }
  
  .btn-icon:focus {
    outline: 3px solid var(--text-primary);
  }
}

/* 动画效果 */
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
  animation: slideInUp var(--duration-slow) var(--ease-out);
}

/* 微交互 */
.btn-icon {
  position: relative;
  overflow: hidden;
}

.btn-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: var(--primary-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width var(--duration-fast) var(--ease-out),
              height var(--duration-fast) var(--ease-out);
  opacity: 0.1;
}

.btn-icon:hover::before {
  width: 100%;
  height: 100%;
}

/* 复制成功状态 */
.btn-icon.copied {
  color: var(--success-color) !important;
  background: rgba(72, 187, 120, 0.1) !important;
}

/* 错误状态 */
.hover-translation-box.error .translated-text .text-content {
  color: var(--error-color);
}

/* 加载状态 */
.hover-translation-box.loading .translation-content {
  opacity: 0.6;
}

.hover-translation-box.loading .loading-indicator {
  display: flex;
}

.hover-translation-box.loading .provider-info {
  display: none;
}
`;

/**
 * 获取完整的样式字符串（包含 CSS 变量）
 */
export function getHoverBoxStyles(): string {
  return CSS_VARIABLES + '\n' + HOVER_BOX_STYLES;
}
