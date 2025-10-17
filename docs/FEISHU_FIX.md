# 飞书事件冲突问题修复

## 🐛 问题描述

在飞书文档页面上，点击悬浮框的按钮（复制、播放等）会导致悬浮框立即关闭，无法正常使用。

## 🔍 问题原因

### 事件执行顺序问题

我们的代码使用了**捕获阶段**监听文档点击事件：

```typescript
document.addEventListener('click', this.documentClickListener, true);  // true = 捕获阶段
```

事件传播顺序：
1. **捕获阶段**（从 document 到目标元素）
2. **目标阶段**（在目标元素上）
3. **冒泡阶段**（从目标元素到 document）

### 问题流程

```
用户点击按钮
  ↓
1. 捕获阶段：document.click 触发
   → handleDocumentClick 执行
   → 检查 isButtonClicking（此时还是 false！）
   → 判断为外部点击
   → 关闭悬浮框 ❌
  ↓
2. 目标阶段：button.click 触发
   → 设置 isButtonClicking = true（太晚了！）
   → 执行按钮功能
```

**关键问题**：在捕获阶段，按钮的 click 事件还没有触发，所以 `isButtonClicking` 标志还是 `false`！

## ✅ 解决方案

### 方案 1: 使用 mousedown 事件提前设置标志

在 `mousedown` 事件（比 `click` 更早触发）的捕获阶段设置标志：

```typescript
// 在捕获阶段设置标志，确保在 handleDocumentClick 之前执行
this.copyBtn?.addEventListener('mousedown', () => {
  this.isButtonClicking = true;
  console.log('[HoverBox] 复制按钮 mousedown，设置标志');
}, true);  // true = 捕获阶段

this.copyBtn?.addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  event.preventDefault();
  this.copyToClipboard();
  setTimeout(() => { 
    this.isButtonClicking = false;
  }, 200);
});
```

### 方案 2: 在捕获阶段立即阻止事件传播

当检测到点击在悬浮框内部时，立即阻止事件传播：

```typescript
private readonly handleDocumentClick = (event: MouseEvent): void => {
  if (!this.isVisible) return;

  // 检查是否点击在内部
  if (this.shadowWrapper) {
    const clickedInside = this.shadowWrapper.containsClick(event);
    
    if (clickedInside) {
      console.log('[HoverBox] 点击在内部，阻止事件传播');
      // 在捕获阶段立即阻止
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
  }
  
  // 点击在外部，关闭悬浮框
  this.hide();
};
```

## 📊 事件时序图

### 修复前（有问题）

```
时间轴 →

1. mousedown on button
2. mouseup on button
3. click on document (捕获阶段)
   → handleDocumentClick
   → isButtonClicking = false ❌
   → hide()
4. click on button (目标阶段)
   → isButtonClicking = true (太晚了)
   → 执行按钮功能
```

### 修复后（正常）

```
时间轴 →

1. mousedown on button (捕获阶段)
   → isButtonClicking = true ✅
2. mouseup on button
3. click on document (捕获阶段)
   → handleDocumentClick
   → isButtonClicking = true ✅
   → return (不关闭)
4. click on button (目标阶段)
   → 执行按钮功能
   → setTimeout 重置标志
```

## 🔧 关键改进

### 1. 双重保护机制

```typescript
// 保护 1: 提前设置标志
this.soundBtn?.addEventListener('mousedown', () => {
  this.isButtonClicking = true;
}, true);

// 保护 2: 在捕获阶段阻止传播
if (clickedInside) {
  event.stopImmediatePropagation();
  event.preventDefault();
  return;
}
```

### 2. 增加标志重置时间

```typescript
setTimeout(() => { 
  this.isButtonClicking = false;
}, 200);  // 从 100ms 增加到 200ms
```

### 3. 详细的日志输出

```typescript
console.log('[HoverBox] 播放按钮 mousedown，设置标志');
console.log('[HoverBox] 按钮点击中，忽略文档点击');
console.log('[HoverBox] 点击在内部，阻止事件传播');
```

## 🧪 测试场景

### 测试 1: 飞书文档
- ✅ 点击播放按钮不会关闭悬浮框
- ✅ 点击复制按钮不会关闭悬浮框
- ✅ 点击外部正常关闭悬浮框

### 测试 2: 其他网站
- ✅ GitHub
- ✅ Google Docs
- ✅ Notion
- ✅ 知乎

## 📝 技术要点

### 事件传播阶段

1. **捕获阶段** (Capture Phase)
   - 从 window → document → body → ... → 目标元素
   - 使用 `addEventListener(event, handler, true)`

2. **目标阶段** (Target Phase)
   - 在目标元素上触发

3. **冒泡阶段** (Bubble Phase)
   - 从目标元素 → ... → body → document → window
   - 使用 `addEventListener(event, handler, false)` 或省略第三个参数

### 为什么使用捕获阶段？

1. **优先级更高**：在页面的其他事件处理器之前执行
2. **防止被拦截**：某些页面（如飞书）可能在冒泡阶段拦截事件
3. **更可靠**：即使页面使用 `stopPropagation()`，我们也能先执行

### 为什么使用 mousedown？

1. **更早触发**：mousedown → mouseup → click
2. **提前设置标志**：在 click 事件的捕获阶段之前
3. **更可靠**：不受 click 事件的影响

## 🎯 最佳实践

### 1. 事件监听顺序

```typescript
// 1. 先监听 mousedown（捕获阶段）
button.addEventListener('mousedown', setFlag, true);

// 2. 再监听 click（目标阶段）
button.addEventListener('click', handleClick);

// 3. 文档监听（捕获阶段）
document.addEventListener('click', handleDocumentClick, true);
```

### 2. 标志管理

```typescript
// 设置标志
this.isButtonClicking = true;

// 执行操作
doSomething();

// 延迟重置（确保所有事件都处理完）
setTimeout(() => {
  this.isButtonClicking = false;
}, 200);
```

### 3. 事件阻止

```typescript
// 在捕获阶段立即阻止
if (clickedInside) {
  event.stopImmediatePropagation();  // 阻止同阶段的其他监听器
  event.preventDefault();             // 阻止默认行为
  return;
}
```

## 📚 参考资料

- [MDN: Event.stopImmediatePropagation()](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation)
- [MDN: EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [Event Capturing and Bubbling](https://javascript.info/bubbling-and-capturing)

---

**修复日期**: 2025-10-17  
**修复版本**: v0.2.1  
**影响范围**: 飞书文档、其他使用事件拦截的页面
