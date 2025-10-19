# UI 配色方案重设计 - 设计文档

## Overview

本设计文档详细说明如何实现混合优化配色方案（方案 B），在保持现有组件结构的基础上，通过更新 CSS 变量系统来提升视觉层次、可读性和现代感。设计遵循渐进增强原则，确保向后兼容并支持主题切换。

## Architecture

### 设计原则

1. **CSS 变量驱动**: 所有颜色通过 CSS 变量定义，便于主题切换和维护
2. **语义化命名**: 变量名反映用途而非具体颜色值
3. **分层设计**: 基础色 → 语义色 → 组件色，三层抽象
4. **渐进增强**: 优先支持现代浏览器，提供降级方案
5. **可访问性优先**: 所有配色符合 WCAG 2.1 AA 标准

### 色彩系统架构

```
基础色板 (Base Colors)
    ↓
语义化颜色 (Semantic Colors)
    ↓
组件级颜色 (Component Colors)
    ↓
主题变体 (Theme Variants)
```

## Components and Interfaces

### 1. 色彩系统 (Color System)

#### 1.1 基础色板

```css
/* 中性灰色系 - 基于 Tailwind Gray */
--gray-50: #F9FAFB;   /* 最浅 - 背景 */
--gray-100: #F3F4F6;  /* 次浅 - 次级背景 */
--gray-200: #E5E7EB;  /* 边框、分割线 */
--gray-300: #D1D5DB;  /* 禁用状态 */
--gray-400: #9CA3AF;  /* 占位符 */
--gray-500: #6B7280;  /* 次要文本 */
--gray-600: #4B5563;  /* 常规文本 */
--gray-700: #374151;  /* 重要文本 */
--gray-800: #1F2937;  /* 标题文本 */
--gray-900: #111827;  /* 最深 - 强调文本 */

/* 品牌色 - 保持现有紫色系 */
--brand-50: #F5F3FF;
--brand-100: #EDE9FE;
--brand-200: #DDD6FE;
--brand-300: #C4B5FD;
--brand-400: #A78BFA;
--brand-500: #8B5CF6;  /* 主品牌色 */
--brand-600: #7C3AED;
--brand-700: #6D28D9;
--brand-800: #5B21B6;
--brand-900: #4C1D95;

/* 功能色 */
--success-50: #ECFDF5;
--success-500: #10B981;
--success-700: #047857;

--error-50: #FEF2F2;
--error-500: #EF4444;
--error-700: #B91C1C;

--warning-50: #FFFBEB;
--warning-500: #F59E0B;
--warning-700: #B45309;

--info-50: #EFF6FF;
--info-500: #3B82F6;
--info-700: #1D4ED8;
```

#### 1.2 语义化颜色映射

```css
/* 文本颜色 */
--text-primary: var(--gray-800);      /* #1F2937 - 主要内容 */
--text-secondary: var(--gray-600);    /* #4B5563 - 次要内容 */
--text-tertiary: var(--gray-500);     /* #6B7280 - 辅助信息 */
--text-disabled: var(--gray-400);     /* #9CA3AF - 禁用状态 */
--text-inverse: #FFFFFF;              /* 深色背景上的文本 */
--text-brand: var(--brand-600);       /* #7C3AED - 品牌色文本 */

/* 背景颜色 */
--bg-primary: #FFFFFF;                /* 主背景 - 纯白 */
--bg-secondary: var(--gray-50);       /* #F9FAFB - 次级背景 */
--bg-tertiary: var(--gray-100);       /* #F3F4F6 - 三级背景 */
--bg-elevated: #FFFFFF;               /* 悬浮元素背景 */
--bg-overlay: rgba(17, 24, 39, 0.5);  /* 遮罩层 */

/* 边框颜色 */
--border-light: var(--gray-200);      /* #E5E7EB - 常规边框 */
--border-medium: var(--gray-300);     /* #D1D5DB - 强调边框 */
--border-dark: var(--gray-400);       /* #9CA3AF - 深色边框 */
--border-brand: var(--brand-500);     /* 品牌色边框 */

/* 交互状态颜色 */
--interactive-default: var(--gray-700);
--interactive-hover: var(--gray-800);
--interactive-active: var(--gray-900);
--interactive-disabled: var(--gray-300);
```

### 2. 组件配色方案

#### 2.1 悬浮翻译框 (Hover Translation Box)

```css
/* 整体容器 */
.hover-translation-box {
  background: var(--bg-primary);           /* 纯白背景 */
  border: 1px solid var(--border-light);   /* 浅灰边框 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 
              0 0 1px rgba(0, 0, 0, 0.04);  /* 柔和阴影 */
}

/* 头部工具栏 */
.translation-header {
  background: var(--bg-primary);           /* 纯白 - 最突出 */
  border-bottom: 1px solid var(--border-light);
}

/* 语言指示器 */
.language-indicator {
  color: var(--text-secondary);            /* #4B5563 */
  font-weight: 500;
}

/* 内容区域 */
.translation-content {
  background: var(--bg-primary);           /* 纯白 */
}

/* 原文区域 */
.original-text {
  background: var(--bg-secondary);         /* #F9FAFB - 浅灰 */
  padding: 12px;
  border-radius: 6px;
}

.original-text .text-label {
  color: var(--text-tertiary);             /* #6B7280 */
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.original-text .text-content {
  color: var(--text-secondary);            /* #4B5563 */
  line-height: 1.6;
}

/* 译文区域 */
.translated-text {
  background: var(--bg-primary);           /* 纯白 - 最重要 */
  padding: 12px;
  border-radius: 6px;
}

.translated-text .text-label {
  color: var(--text-tertiary);             /* #6B7280 */
}

.translated-text .text-content {
  color: var(--text-primary);              /* #1F2937 - 最深最清晰 */
  font-weight: 500;
  line-height: 1.6;
}

/* 底部信息栏 */
.translation-footer {
  background: var(--bg-secondary);         /* #F9FAFB */
  border-top: 1px solid var(--border-light);
}

.provider-info {
  color: var(--text-tertiary);             /* #6B7280 */
  font-size: 11px;
}
```

#### 2.2 按钮系统

```css
/* 图标按钮 - 默认状态 */
.btn-icon {
  background: var(--bg-primary);           /* 白色 */
  border: 1px solid var(--border-medium);  /* #D1D5DB */
  color: var(--text-secondary);            /* #4B5563 */
  border-radius: 6px;
  transition: all 150ms ease-out;
}

/* 图标按钮 - 悬停状态 */
.btn-icon:hover {
  background: var(--bg-secondary);         /* #F9FAFB */
  border-color: var(--border-dark);        /* #9CA3AF */
  color: var(--text-primary);              /* #1F2937 */
}

/* 图标按钮 - 激活状态 */
.btn-icon:active {
  background: var(--bg-tertiary);          /* #F3F4F6 */
  transform: scale(0.95);
}

/* 图标按钮 - 聚焦状态 */
.btn-icon:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}

/* 主要按钮 */
.btn-primary {
  background: var(--brand-600);            /* #7C3AED */
  color: var(--text-inverse);
  border: none;
}

.btn-primary:hover {
  background: var(--brand-700);            /* #6D28D9 */
}

/* 成功状态按钮 */
.btn-icon.success {
  background: var(--success-50);
  border-color: var(--success-500);
  color: var(--success-700);
}
```

#### 2.3 Toast 通知

```css
.toast {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
}

.toast.success {
  border-left: 3px solid var(--success-500);
}

.toast.error {
  border-left: 3px solid var(--error-500);
}

.toast.warning {
  border-left: 3px solid var(--warning-500);
}

.toast.info {
  border-left: 3px solid var(--info-500);
}
```

### 3. 深色主题 (Dark Theme)

```css
[data-theme="dark"] {
  /* 基础色反转 */
  --gray-50: #1F2937;
  --gray-100: #374151;
  --gray-200: #4B5563;
  --gray-300: #6B7280;
  --gray-400: #9CA3AF;
  --gray-500: #D1D5DB;
  --gray-600: #E5E7EB;
  --gray-700: #F3F4F6;
  --gray-800: #F9FAFB;
  --gray-900: #FFFFFF;

  /* 语义色调整 */
  --text-primary: var(--gray-800);         /* #F9FAFB */
  --text-secondary: var(--gray-600);       /* #E5E7EB */
  --text-tertiary: var(--gray-500);        /* #D1D5DB */
  
  --bg-primary: #111827;                   /* 深色背景 */
  --bg-secondary: #1F2937;
  --bg-tertiary: #374151;
  --bg-elevated: #1F2937;
  
  --border-light: #374151;
  --border-medium: #4B5563;
  --border-dark: #6B7280;

  /* 品牌色在深色模式下稍微调亮 */
  --brand-primary: var(--brand-400);       /* #A78BFA */
}
```

## Data Models

### 主题配置数据结构

```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  customColors?: {
    brand?: string;
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
}

interface ColorToken {
  name: string;
  value: string;
  description: string;
  contrastRatio?: number;
}

interface ThemeColors {
  base: ColorToken[];
  semantic: ColorToken[];
  component: ColorToken[];
}
```

## Implementation Strategy

### 阶段 1: 更新 CSS 变量系统 (优先级: 高)

**文件**: `src/styles/variables.css`

1. 替换所有基础色变量为新的灰色系统
2. 更新语义化颜色映射
3. 添加深色主题变量
4. 保持向后兼容（保留旧变量名作为别名）

### 阶段 2: 更新组件样式 (优先级: 高)

**文件**: 
- `src/styles/hover-box.css`
- `src/styles/content.css`
- `src/styles/floating-button.css`
- `src/styles/toast.css`

1. 更新悬浮翻译框背景和边框
2. 优化文本颜色对比度
3. 更新按钮交互状态
4. 调整阴影效果

### 阶段 3: 实现主题切换 (优先级: 中)

**新增文件**: `src/shared/theme-manager.ts`

1. 创建主题管理器
2. 实现主题切换逻辑
3. 支持系统主题自动检测
4. 持久化用户主题偏好

### 阶段 4: 添加主题切换 UI (优先级: 中)

**文件**: 
- `src/options/options.html`
- `src/options/options.ts`

1. 在设置页面添加主题选择器
2. 实时预览主题效果
3. 添加主题切换动画

### 阶段 5: 可访问性测试和优化 (优先级: 高)

1. 验证所有颜色对比度
2. 测试键盘导航
3. 测试屏幕阅读器兼容性
4. 高对比度模式支持

## Testing Strategy

### 1. 视觉回归测试

- 对比新旧设计的截图
- 确保所有组件正确渲染
- 验证不同浏览器的一致性

### 2. 对比度测试

```javascript
// 使用工具验证对比度
const contrastTests = [
  { fg: '#1F2937', bg: '#FFFFFF', expected: '>= 12.6' },
  { fg: '#4B5563', bg: '#F9FAFB', expected: '>= 7.0' },
  { fg: '#6B7280', bg: '#FFFFFF', expected: '>= 4.5' },
];
```

### 3. 主题切换测试

- 测试浅色/深色主题切换
- 验证系统主题自动检测
- 测试主题持久化

### 4. 兼容性测试

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 5. 用户测试

- A/B 测试新旧配色方案
- 收集用户反馈
- 测量可读性和满意度

## Error Handling

### 1. CSS 变量降级

```css
/* 提供降级方案 */
.hover-translation-box {
  background: #FFFFFF; /* 降级值 */
  background: var(--bg-primary); /* 现代浏览器 */
}
```

### 2. 主题加载失败

```typescript
function loadTheme(theme: string): void {
  try {
    document.documentElement.setAttribute('data-theme', theme);
  } catch (error) {
    console.error('Failed to load theme:', error);
    // 降级到默认浅色主题
    document.documentElement.removeAttribute('data-theme');
  }
}
```

### 3. 对比度不足警告

```typescript
function validateContrast(fg: string, bg: string): boolean {
  const ratio = calculateContrastRatio(fg, bg);
  if (ratio < 4.5) {
    console.warn(`Contrast ratio ${ratio} is below WCAG AA standard`);
    return false;
  }
  return true;
}
```

## Performance Considerations

### 1. CSS 变量性能

- CSS 变量的性能开销极小
- 避免在动画中频繁修改变量
- 使用 `will-change` 优化动画性能

### 2. 主题切换性能

```css
/* 主题切换时禁用过渡动画，避免闪烁 */
.theme-transitioning * {
  transition: none !important;
}
```

### 3. 减少重绘

- 使用 `transform` 和 `opacity` 实现动画
- 避免修改会触发 layout 的属性

## Migration Guide

### 从旧配色迁移到新配色

```css
/* 旧变量 → 新变量映射 */
--primary-color: #555555;        → --text-primary: #1F2937;
--text-secondary: #666666;       → --text-secondary: #4B5563;
--text-muted: #888888;           → --text-tertiary: #6B7280;
--bg-primary: #f6f6f6;           → --bg-secondary: #F9FAFB;
--bg-secondary: #efefef;         → --bg-tertiary: #F3F4F6;
--border-light: #dadada;         → --border-light: #E5E7EB;
```

### 组件更新清单

- [ ] 更新 `variables.css` 中的所有颜色变量
- [ ] 更新 `hover-box.css` 中的组件样式
- [ ] 更新 `content.css` 中的全局样式
- [ ] 更新 `floating-button.css` 中的按钮样式
- [ ] 更新 `toast.css` 中的通知样式
- [ ] 更新 `options.css` 中的设置页面样式
- [ ] 更新 `popup.css` 中的弹窗样式
- [ ] 添加深色主题支持
- [ ] 实现主题切换功能
- [ ] 进行可访问性测试

## Design Decisions and Rationale

### 1. 为什么选择 Tailwind Gray 色板？

- **广泛验证**: 被数百万开发者使用和验证
- **科学配比**: 色阶间距均匀，视觉过渡自然
- **可访问性**: 经过严格的对比度测试
- **生态系统**: 与现代设计工具和框架兼容

### 2. 为什么保留品牌紫色？

- **品牌识别**: 保持产品的独特性
- **情感连接**: 用户已经熟悉的品牌色
- **差异化**: 在中性灰基础上提供视觉亮点

### 3. 为什么采用三层背景色？

- **视觉层次**: 通过背景色深浅建立信息优先级
- **空间感**: 创造深度和立体感
- **内容分组**: 帮助用户快速识别不同区域

### 4. 为什么文本色选择 #1F2937 而非纯黑？

- **减少疲劳**: 纯黑 (#000000) 对比度过高，长时间阅读易疲劳
- **更自然**: 接近印刷品的墨色，更符合阅读习惯
- **仍然清晰**: 12.6:1 的对比度远超 WCAG AAA 标准

### 5. 为什么使用 6px 圆角？

- **现代感**: 符合当前设计趋势
- **柔和**: 比直角更友好，比大圆角更专业
- **一致性**: 与主流设计系统（Material Design 3, iOS）保持一致

## Accessibility Compliance

### WCAG 2.1 合规性

| 元素 | 前景色 | 背景色 | 对比度 | 等级 |
|------|--------|--------|--------|------|
| 主要文本 | #1F2937 | #FFFFFF | 12.6:1 | AAA ✅ |
| 次要文本 | #4B5563 | #F9FAFB | 7.2:1 | AAA ✅ |
| 辅助文本 | #6B7280 | #FFFFFF | 4.6:1 | AA ✅ |
| 按钮文本 | #4B5563 | #FFFFFF | 8.6:1 | AAA ✅ |
| 链接文本 | #7C3AED | #FFFFFF | 5.8:1 | AA ✅ |

### 键盘导航支持

- 所有交互元素可通过 Tab 键访问
- 焦点状态清晰可见（2px 品牌色轮廓）
- 支持 Enter/Space 激活按钮

### 屏幕阅读器支持

- 使用语义化 HTML 标签
- 提供 ARIA 标签和描述
- 确保内容顺序逻辑清晰

## Future Enhancements

1. **自定义主题**: 允许用户自定义品牌色
2. **高对比度模式**: 为视力障碍用户提供超高对比度选项
3. **色盲友好模式**: 调整配色以适应色盲用户
4. **动态主题**: 根据时间自动切换主题
5. **主题市场**: 社区贡献的主题包

## References

- [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design 3 Color System](https://m3.material.io/styles/color/overview)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
