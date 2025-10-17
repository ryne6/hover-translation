# Shadow DOM 重构 PRD - 悬浮翻译框隔离方案

## 文档信息
- **创建日期**: 2025-10-17
- **版本**: v1.0
- **状态**: 待评审
- **优先级**: P0 (最高优先级)
- **预计工期**: 3-5 天

## 1. 背景与问题

### 1.1 当前问题

#### 问题 1: z-index 冲突
- **现象**: 在某些网站（如 v0.dev）悬浮框被页面元素遮挡
- **原因**: 页面使用了极高的 z-index 值，即使设置 `2147483647` 也无法保证最高层级
- **影响**: 用户无法看到翻译结果，功能完全失效

#### 问题 2: 事件冲突
- **现象**: 在某些网站（如飞书文档）点击播放按钮会关闭悬浮框
- **原因**: 页面的全局事件监听器拦截了我们的事件
- **影响**: 用户无法使用语音播放功能

#### 问题 3: 样式污染
- **现象**: 某些网站的全局样式会影响悬浮框样式
- **原因**: CSS 选择器冲突，页面样式覆盖了我们的样式
- **影响**: 悬浮框显示异常，用户体验差

### 1.2 根本原因

所有问题的根本原因：**悬浮框与页面共享同一个 DOM 树和样式作用域**

- DOM 树共享 → z-index 冲突
- 事件系统共享 → 事件被拦截
- 样式作用域共享 → 样式被污染

## 2. 解决方案：Shadow DOM

### 2.1 什么是 Shadow DOM

Shadow DOM 是 Web Components 标准的一部分，提供：
- **DOM 隔离**: 独立的 DOM 树，不受外部影响
- **样式隔离**: 独立的样式作用域，内外互不影响
- **事件隔离**: 事件不会泄露到外部（可配置）

### 2.2 为什么选择 Shadow DOM

| 特性 | 当前方案 | Shadow DOM |
|------|---------|-----------|
| z-index 隔离 | ❌ 受页面影响 | ✅ 完全隔离 |
| 样式隔离 | ❌ 可能被覆盖 | ✅ 完全隔离 |
| 事件隔离 | ❌ 可能被拦截 | ✅ 可配置隔离 |
| 浏览器支持 | ✅ 100% | ✅ 97%+ |
| 性能 | ✅ 好 | ✅ 好 |
| 标准化 | ✅ 标准 DOM | ✅ Web 标准 |
| 实现复杂度 | ✅ 简单 | ⚠️ 中等 |

### 2.3 技术方案

```typescript
// 创建 Shadow DOM 容器
const container = document.createElement('div');
const shadowRoot = container.attachShadow({ mode: 'closed' });

// 注入样式
const style = document.createElement('style');
style.textContent = `/* 所有样式 */`;
shadowRoot.appendChild(style);

// 创建内容
const content = document.createElement('div');
content.innerHTML = template;
shadowRoot.appendChild(content);

// 添加到页面
document.body.appendChild(container);
```

## 3. 详细设计

### 3.1 架构设计

#### 3.1.1 整体架构

```
Page DOM
  └── <div class="hover-translation-container">  ← 容器（Light DOM）
        └── #shadow-root (closed)                ← Shadow DOM
              ├── <style>                         ← 样式
              │     └── 所有 CSS
              └── <div class="hover-translation-box">  ← 内容
                    ├── Header
                    ├── Content
                    └── Footer
```

#### 3.1.2 模式选择

使用 **closed mode**：
- 外部无法通过 `element.shadowRoot` 访问
- 更好的封装性
- 防止页面脚本干扰

### 3.2 核心类重构

#### 3.2.1 HoverBox 类

**当前结构**：
```typescript
class HoverBox {
  private box: HTMLDivElement | null;  // 直接在 Light DOM
  
  create(): void {
    this.box = document.createElement('div');
    this.box.innerHTML = template;
    document.body.appendChild(this.box);
  }
}
```

**重构后结构**：
```typescript
class HoverBox {
  private container: HTMLDivElement | null;      // Light DOM 容器
  private shadowRoot: ShadowRoot | null;         // Shadow Root
  private box: HTMLDivElement | null;            // Shadow DOM 中的内容
  
  create(): void {
    // 1. 创建容器
    this.container = document.createElement('div');
    this.container.className = 'hover-translation-container';
    
    // 2. 创建 Shadow DOM
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });
    
    // 3. 注入样式
    this.injectStyles();
    
    // 4. 创建内容
    this.box = document.createElement('div');
    this.box.className = 'hover-translation-box';
    this.box.innerHTML = this.getTemplate();
    
    // 5. 组装
    this.shadowRoot.appendChild(this.box);
    document.body.appendChild(this.container);
    
    // 6. 绑定事件
    this.addEventListeners();
  }
  
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot!.appendChild(style);
  }
  
  private getStyles(): string {
    return `
      /* 所有 hover-box.css 的内容 */
      .hover-translation-box {
        position: fixed;
        z-index: 2147483647;
        /* ... */
      }
    `;
  }
}
```

#### 3.2.2 样式处理

**方案 A: 内联样式（推荐）**
```typescript
private getStyles(): string {
  return `
    /* 直接嵌入所有 CSS */
    .hover-translation-box { /* ... */ }
  `;
}
```

**优点**：
- ✅ 完全自包含
- ✅ 不需要额外请求
- ✅ 加载速度快

**缺点**：
- ⚠️ 代码体积稍大
- ⚠️ 不能使用 CSS 文件的缓存

**方案 B: 动态加载**
```typescript
private async injectStyles(): Promise<void> {
  const cssUrl = chrome.runtime.getURL('styles/hover-box.css');
  const response = await fetch(cssUrl);
  const css = await response.text();
  
  const style = document.createElement('style');
  style.textContent = css;
  this.shadowRoot!.appendChild(style);
}
```

**推荐**: 使用方案 A（内联样式），因为：
1. 样式文件不大（~10KB）
2. 避免异步加载延迟
3. 更可靠

#### 3.2.3 事件处理

**关键点**：
- Shadow DOM 内部的事件会重新定向（retarget）
- 需要在 Shadow DOM 内部监听事件
- 外部点击检测需要特殊处理

**实现**：
```typescript
addEventListeners(): void {
  // 内部事件：在 Shadow DOM 内部监听
  const copyBtn = this.shadowRoot!.querySelector('.copy-btn');
  copyBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    this.copyToClipboard();
  });
  
  // 外部点击：在 document 上监听
  document.addEventListener('click', (e) => {
    // 检查点击是否在容器内
    if (!this.container?.contains(e.target as Node)) {
      this.hide();
    }
  }, true); // 使用捕获阶段
}
```

#### 3.2.4 定位计算

**关键点**：
- 容器（Light DOM）负责定位
- 内容（Shadow DOM）相对于容器定位

**实现**：
```typescript
positionBox(): void {
  if (!this.container || !this.currentRange) return;
  
  const selectionRect = this.currentRange.getBoundingClientRect();
  const boxRect = this.box!.getBoundingClientRect();
  
  // 计算位置
  const position = calculateOptimalPosition(selectionRect, boxRect, viewport);
  
  // 设置容器位置（Light DOM）
  this.container.style.position = 'fixed';
  this.container.style.left = `${position.x}px`;
  this.container.style.top = `${position.y}px`;
  this.container.style.zIndex = '2147483647';
  
  // Shadow DOM 内容相对定位
  this.box!.style.position = 'relative';
}
```

### 3.3 图标处理

**问题**: Shadow DOM 无法直接访问 Chrome Extension 的资源

**解决方案**：
```typescript
private getIconUrl(filename: string): string {
  // 获取完整 URL
  const url = chrome.runtime.getURL(`assets/icons/${filename}`);
  return url;
}

private getTemplate(): string {
  const soundIcon = this.getIconUrl('horn.svg');
  const copyIcon = this.getIconUrl('copy.svg');
  
  return `
    <button class="btn-icon sound-btn">
      <img src="${soundIcon}" alt="播放" />
    </button>
  `;
}
```

### 3.4 兼容性处理

#### 3.4.1 浏览器支持

| 浏览器 | 版本 | 支持度 |
|--------|------|--------|
| Chrome | 53+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| Firefox | 63+ | ✅ 完全支持 |
| Safari | 10+ | ✅ 完全支持 |

**目标浏览器**: Chrome 90+（扩展要求）

#### 3.4.2 降级方案

```typescript
create(): void {
  if (this.supportsShadowDOM()) {
    this.createWithShadowDOM();
  } else {
    this.createLegacy(); // 回退到当前实现
  }
}

private supportsShadowDOM(): boolean {
  return 'attachShadow' in Element.prototype;
}
```

## 4. 实施计划

### 4.1 Phase 1: 基础重构（2 天）

#### 4.1.1 创建 Shadow DOM 包装器
- [ ] 创建 `ShadowDOMWrapper` 工具类
- [ ] 实现 Shadow DOM 创建和管理
- [ ] 实现样式注入机制
- [ ] 单元测试

#### 4.1.2 重构 HoverBox 类
- [ ] 修改 `create()` 方法使用 Shadow DOM
- [ ] 重构样式注入逻辑
- [ ] 重构事件处理逻辑
- [ ] 重构定位计算逻辑

#### 4.1.3 样式迁移
- [ ] 提取 `hover-box.css` 内容
- [ ] 转换为内联样式字符串
- [ ] 处理 CSS 变量和主题
- [ ] 测试样式隔离

### 4.2 Phase 2: 功能适配（1-2 天）

#### 4.2.1 图标和资源
- [ ] 修改图标加载逻辑
- [ ] 使用完整 URL 路径
- [ ] 测试资源加载

#### 4.2.2 事件系统
- [ ] 重构内部事件监听
- [ ] 重构外部点击检测
- [ ] 测试事件隔离
- [ ] 测试按钮交互

#### 4.2.3 动画和过渡
- [ ] 测试 CSS 动画
- [ ] 测试显示/隐藏过渡
- [ ] 优化性能

### 4.3 Phase 3: 测试和优化（1 天）

#### 4.3.1 兼容性测试
- [ ] 测试 v0.dev（z-index 问题）
- [ ] 测试飞书文档（事件问题）
- [ ] 测试 GitHub（样式问题）
- [ ] 测试其他常见网站

#### 4.3.2 功能测试
- [ ] 测试翻译显示
- [ ] 测试语音播放
- [ ] 测试复制功能
- [ ] 测试定位计算

#### 4.3.3 性能优化
- [ ] 优化样式注入
- [ ] 优化事件处理
- [ ] 测试内存泄漏

## 5. 技术细节

### 5.1 样式隔离

#### 5.1.1 CSS 变量处理

**问题**: Shadow DOM 无法继承外部 CSS 变量

**解决方案**: 在 Shadow DOM 内部重新定义
```css
:host {
  /* 重新定义所有需要的 CSS 变量 */
  --primary-color: #3498db;
  --text-color: #2c3e50;
  /* ... */
}
```

#### 5.1.2 字体处理

**问题**: Shadow DOM 可以继承字体，但可能不一致

**解决方案**: 显式设置字体
```css
.hover-translation-box {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### 5.2 事件处理

#### 5.2.1 事件重定向（Event Retargeting）

Shadow DOM 会重定向事件的 `target`：
```typescript
// 外部监听器看到的 target 是容器
document.addEventListener('click', (e) => {
  console.log(e.target); // <div class="hover-translation-container">
});

// 内部监听器看到的 target 是实际元素
shadowRoot.addEventListener('click', (e) => {
  console.log(e.target); // <button class="copy-btn">
});
```

#### 5.2.2 外部点击检测

```typescript
private handleDocumentClick = (e: MouseEvent): void => {
  // 方法 1: 检查容器
  if (!this.container?.contains(e.target as Node)) {
    this.hide();
  }
  
  // 方法 2: 使用 composedPath（更可靠）
  const path = e.composedPath();
  if (!path.includes(this.container!)) {
    this.hide();
  }
};
```

### 5.3 性能考虑

#### 5.3.1 样式注入优化

```typescript
// 缓存样式字符串
private static styleCache: string | null = null;

private getStyles(): string {
  if (HoverBox.styleCache) {
    return HoverBox.styleCache;
  }
  
  HoverBox.styleCache = `/* CSS content */`;
  return HoverBox.styleCache;
}
```

#### 5.3.2 DOM 操作优化

```typescript
// 批量操作
private injectStyles(): void {
  const fragment = document.createDocumentFragment();
  
  const style = document.createElement('style');
  style.textContent = this.getStyles();
  fragment.appendChild(style);
  
  this.shadowRoot!.appendChild(fragment);
}
```

## 6. 风险与挑战

### 6.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 浏览器兼容性问题 | 中 | 低 | 添加降级方案 |
| 样式迁移问题 | 中 | 中 | 充分测试 |
| 事件处理复杂度 | 中 | 中 | 详细设计和测试 |
| 性能下降 | 低 | 低 | 性能测试和优化 |

### 6.2 实施风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 开发时间超期 | 中 | 中 | 分阶段实施 |
| 引入新 Bug | 高 | 中 | 充分测试 |
| 用户体验变化 | 低 | 低 | 保持 UI 一致 |

## 7. 测试策略

### 7.1 单元测试

```typescript
describe('HoverBox with Shadow DOM', () => {
  test('should create Shadow DOM', () => {
    const hoverBox = new HoverBox();
    hoverBox.create();
    
    expect(hoverBox.container).toBeTruthy();
    expect(hoverBox.shadowRoot).toBeTruthy();
  });
  
  test('should inject styles', () => {
    const hoverBox = new HoverBox();
    hoverBox.create();
    
    const style = hoverBox.shadowRoot!.querySelector('style');
    expect(style).toBeTruthy();
    expect(style!.textContent).toContain('.hover-translation-box');
  });
  
  test('should isolate events', () => {
    const hoverBox = new HoverBox();
    hoverBox.create();
    
    const clickHandler = jest.fn();
    document.addEventListener('click', clickHandler);
    
    // 点击内部按钮
    const button = hoverBox.shadowRoot!.querySelector('.copy-btn');
    button?.click();
    
    // 外部监听器应该收到事件，但 target 是容器
    expect(clickHandler).toHaveBeenCalled();
    expect(clickHandler.mock.calls[0][0].target).toBe(hoverBox.container);
  });
});
```

### 7.2 集成测试

**测试场景**：
1. 在 v0.dev 上测试 z-index
2. 在飞书文档上测试事件
3. 在 GitHub 上测试样式
4. 在各种网站上测试定位

### 7.3 兼容性测试

**测试矩阵**：
- Chrome 90, 100, 110, 最新版
- Edge 最新版
- 不同操作系统（Windows, macOS, Linux）

## 8. 成功指标

### 8.1 功能指标

- ✅ z-index 问题解决率: 100%
- ✅ 事件冲突解决率: 100%
- ✅ 样式污染解决率: 100%

### 8.2 性能指标

- ✅ 创建时间: < 50ms
- ✅ 显示延迟: < 100ms
- ✅ 内存占用: < 5MB

### 8.3 质量指标

- ✅ 单元测试覆盖率: > 90%
- ✅ 集成测试通过率: 100%
- ✅ 兼容性测试通过率: 100%

## 9. 发布计划

### 9.1 Alpha 版本（内部测试）
- 完成基础重构
- 内部测试验证

### 9.2 Beta 版本（小范围测试）
- 完成所有功能
- 邀请用户测试

### 9.3 正式版本
- 修复所有已知问题
- 正式发布

## 10. 文档更新

### 10.1 开发文档
- [ ] 更新架构文档
- [ ] 更新 API 文档
- [ ] 添加 Shadow DOM 使用指南

### 10.2 用户文档
- [ ] 更新 README
- [ ] 更新 CHANGELOG
- [ ] 添加迁移说明

## 11. 后续优化

### 11.1 短期（1-2 周）
- 优化样式注入性能
- 添加更多测试用例
- 收集用户反馈

### 11.2 中期（1-2 月）
- 考虑使用 Constructable Stylesheets
- 优化事件处理性能
- 添加更多自定义选项

### 11.3 长期（3-6 月）
- 探索 Declarative Shadow DOM
- 考虑 Web Components 化
- 提供更多主题选项

## 12. 参考资料

### 12.1 技术文档
- [Shadow DOM v1: Self-Contained Web Components](https://developers.google.com/web/fundamentals/web-components/shadowdom)
- [Using shadow DOM - MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [Shadow DOM - W3C Spec](https://www.w3.org/TR/shadow-dom/)

### 12.2 最佳实践
- [Web Components Best Practices](https://developers.google.com/web/fundamentals/web-components/best-practices)
- [Shadow DOM Event Model](https://javascript.info/shadow-dom-events)

---

**最后更新**: 2025-10-17  
**作者**: Kiro AI Assistant  
**审批状态**: 待审批
