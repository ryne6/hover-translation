# 配置页面自动保存优化 PRD

## 文档信息

- **创建日期**: 2025-10-17
- **版本**: v1.0
- **状态**: 待评审
- **优先级**: P1 (高优先级)

## 1. 背景与问题

### 1.1 当前用户体验问题

用户在配置翻译服务（如有道翻译）时，需要经历以下繁琐的步骤：

1. **输入配置信息** - 在翻译服务配置区域输入 AppID、AppSecret 等信息
2. **点击验证按钮** - 验证配置是否正确
3. **看到验证成功提示** - 弹出 alert 提示"验证成功！请点击下方'保存所有设置'按钮以应用配置"
4. **滚动到页面底部** - 需要手动滚动到页面最下方
5. **点击"保存所有设置"按钮** - 才能真正保存配置
6. **再次滚动到语音合成区域** - 找到语音合成配置
7. **启用有道 TTS** - 选择有道作为语音合成提供商

**痛点总结**：

- ❌ 步骤过多，需要 7 步才能完成完整配置
- ❌ 需要多次滚动页面，用户体验差
- ❌ 验证成功后还需要手动保存，容易遗忘
- ❌ 翻译服务配置和语音合成配置分离，需要分别操作
- ❌ 用户可能忘记保存就离开页面，导致配置丢失

### 1.2 用户期望

用户希望：

- ✅ 验证成功后自动保存配置
- ✅ 减少手动操作步骤
- ✅ 相关配置能够联动（如启用有道翻译时自动提示可以启用有道 TTS）
- ✅ 配置流程更加流畅和直观

## 2. 解决方案

### 2.1 核心优化策略

#### 策略 1: 验证成功后自动保存（推荐）

**实现方式**：

- 验证成功后，自动调用保存接口
- 显示保存进度提示（如 Toast 通知）
- 保存成功后显示成功提示

**优点**：

- 减少用户操作步骤
- 避免用户忘记保存
- 体验更流畅

**缺点**：

- 可能与用户预期不符（部分用户可能想批量修改后再保存）
- 需要处理保存失败的情况

#### 策略 2: 智能提示 + 快捷保存

**实现方式**：

- 验证成功后显示浮动的"保存配置"按钮
- 按钮固定在页面右下角，无需滚动
- 点击后自动保存并提示成功

**优点**：

- 保留用户控制权
- 减少滚动操作
- 视觉提示明显

**缺点**：

- 仍需要额外点击操作

#### 策略 3: 配置联动提示（增强功能）

**实现方式**：

- 启用有道翻译服务后，自动检测是否已配置有道 TTS
- 如果未配置，显示提示卡片："您已启用有道翻译，是否同时启用有道语音合成？"
- 提供"一键启用"按钮

**优点**：

- 提升配置发现性
- 减少用户认知负担
- 提供更智能的配置体验

### 2.2 推荐方案：混合策略

结合以上三种策略，提供最佳用户体验：

1. **验证成功后自动保存** - 减少操作步骤
2. **浮动保存按钮** - 作为备选方案，处理批量修改场景
3. **配置联动提示** - 智能推荐相关配置

## 3. 详细设计

### 3.1 自动保存功能

#### 3.1.1 触发时机

- ✅ 翻译服务验证成功后
- ✅ 语音合成配置验证成功后
- ⚠️ 不自动保存的场景：
  - 用户正在批量修改多个配置
  - 用户明确关闭了自动保存功能

#### 3.1.2 保存流程

```
验证成功
  ↓
显示"正在保存配置..."提示
  ↓
调用 saveSettings() API
  ↓
保存成功？
  ├─ 是 → 显示"配置已保存"Toast（绿色，2秒后消失）
  │        ↓
  │      检查是否有相关配置建议
  │        ↓
  │      显示配置联动提示（如适用）
  │
  └─ 否 → 显示"保存失败，请手动保存"Toast（红色）
           ↓
         显示浮动保存按钮
```

#### 3.1.3 UI 设计

**保存进度提示**：

```
┌─────────────────────────────────┐
│ ⏳ 正在保存配置...              │
└─────────────────────────────────┘
```

**保存成功提示**：

```
┌─────────────────────────────────┐
│ ✅ 配置已自动保存               │
└─────────────────────────────────┘
```

**保存失败提示**：

```
┌─────────────────────────────────┐
│ ❌ 保存失败，请手动保存         │
│    [点击这里保存]               │
└─────────────────────────────────┘
```

### 3.2 浮动保存按钮

#### 3.2.1 显示条件

- 页面有未保存的修改
- 用户滚动超过 200px（保存按钮不在视野内）

#### 3.2.2 UI 设计

```
                                    ┌──────────────┐
                                    │ 💾 保存配置  │
                                    └──────────────┘
                                    固定在右下角
                                    带阴影和动画
```

**样式规范**：

- 位置：固定在右下角，距离边缘 20px
- 颜色：主题色（蓝色）
- 大小：48px 高度，自适应宽度
- 动画：淡入淡出，hover 时放大 1.05 倍
- 阴影：0 4px 12px rgba(0,0,0,0.15)

### 3.3 配置联动提示

#### 3.3.1 触发场景

**场景 1：启用有道翻译后**

```
┌─────────────────────────────────────────────┐
│ 💡 提示                                     │
│                                             │
│ 您已启用有道翻译服务，是否同时启用有道语音 │
│ 合成功能？                                  │
│                                             │
│ [一键启用]  [稍后配置]                      │
└─────────────────────────────────────────────┘
```

**场景 2：配置有道 TTS 但未配置翻译服务**

```
┌─────────────────────────────────────────────┐
│ ⚠️ 注意                                     │
│                                             │
│ 有道语音合成需要有道翻译服务的 API 密钥。  │
│ 请先配置有道翻译服务。                      │
│                                             │
│ [前往配置]  [关闭]                          │
└─────────────────────────────────────────────┘
```

#### 3.3.2 联动逻辑

```typescript
// 伪代码
function checkConfigurationSuggestions(providerId: string) {
  if (providerId === 'youdao') {
    const youdaoConfig = settings.providers.youdao;
    const ttsConfig = settings.speech;

    // 如果有道翻译已配置但 TTS 未启用
    if (
      youdaoConfig?.enabled &&
      youdaoConfig?.apiKey &&
      (!ttsConfig?.enabled || ttsConfig?.provider !== 'youdao')
    ) {
      showSuggestion({
        type: 'info',
        message: '您已启用有道翻译服务，是否同时启用有道语音合成功能？',
        actions: [
          { label: '一键启用', handler: enableYoudaoTTS },
          { label: '稍后配置', handler: dismissSuggestion },
        ],
      });
    }
  }
}
```

### 3.4 用户设置

提供用户自定义选项：

```
┌─────────────────────────────────────────────┐
│ ⚙️ 保存设置                                 │
│                                             │
│ □ 验证成功后自动保存配置                    │
│ □ 显示配置建议提示                          │
│ □ 显示浮动保存按钮                          │
└─────────────────────────────────────────────┘
```

## 4. 技术实现

### 4.1 核心功能模块

#### 4.1.1 自动保存管理器

```typescript
class AutoSaveManager {
  private autoSaveEnabled: boolean = true;
  private saveTimeout: number | null = null;

  // 验证成功后自动保存
  async onValidationSuccess(
    providerId: string,
    config: ProviderInstanceConfig
  ) {
    if (!this.autoSaveEnabled) {
      return;
    }

    // 更新配置
    this.updateProviderConfig(providerId, config);

    // 显示保存提示
    this.showSavingToast();

    try {
      // 保存配置
      const success = await this.saveSettings();

      if (success) {
        this.showSuccessToast('配置已自动保存');

        // 检查配置建议
        this.checkConfigSuggestions(providerId);
      } else {
        this.showErrorToast('保存失败，请手动保存');
        this.showFloatingSaveButton();
      }
    } catch (error) {
      this.showErrorToast('保存出错，请手动保存');
      this.showFloatingSaveButton();
    }
  }

  // 检查配置建议
  checkConfigSuggestions(providerId: string) {
    // 实现配置联动逻辑
  }
}
```

#### 4.1.2 Toast 通知组件

```typescript
class ToastNotification {
  show(
    message: string,
    type: 'info' | 'success' | 'error',
    duration: number = 2000
  ) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 动画显示
    setTimeout(() => toast.classList.add('show'), 10);

    // 自动隐藏
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}
```

#### 4.1.3 浮动保存按钮

```typescript
class FloatingSaveButton {
  private button: HTMLButtonElement | null = null;
  private visible: boolean = false;

  show() {
    if (this.visible) return;

    this.button = document.createElement('button');
    this.button.className = 'floating-save-button';
    this.button.innerHTML = '💾 保存配置';
    this.button.onclick = () => this.handleSave();

    document.body.appendChild(this.button);
    this.visible = true;

    // 添加动画
    setTimeout(() => this.button?.classList.add('show'), 10);
  }

  hide() {
    if (!this.visible || !this.button) return;

    this.button.classList.remove('show');
    setTimeout(() => {
      this.button?.remove();
      this.button = null;
      this.visible = false;
    }, 300);
  }

  async handleSave() {
    // 保存逻辑
  }
}
```

### 4.2 CSS 样式

```css
/* Toast 通知 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;
  z-index: 10000;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

.toast-info {
  background: #3498db;
  color: white;
}

.toast-success {
  background: #2ecc71;
  color: white;
}

.toast-error {
  background: #e74c3c;
  color: white;
}

/* 浮动保存按钮 */
.floating-save-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  z-index: 9999;
}

.floating-save-button.show {
  opacity: 1;
  transform: scale(1);
}

.floating-save-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
}

/* 配置建议卡片 */
.config-suggestion {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.config-suggestion-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
```

### 4.3 修改文件清单

1. **src/options/options.ts**
   - 添加 `AutoSaveManager` 类
   - 修改 `validateProvider()` 方法，添加自动保存逻辑
   - 添加配置联动检查逻辑

2. **src/options/options.html**
   - 添加 Toast 通知容器
   - 添加用户设置选项

3. **src/styles/options.css**
   - 添加 Toast 样式
   - 添加浮动按钮样式
   - 添加配置建议卡片样式

4. **src/shared/storage.ts**
   - 确保保存方法支持部分更新

## 5. 用户流程对比

### 5.1 优化前（7 步）

```
1. 输入有道 AppID、AppSecret
   ↓
2. 点击"验证"按钮
   ↓
3. 看到 alert 提示"验证成功"
   ↓
4. 关闭 alert
   ↓
5. 滚动到页面底部
   ↓
6. 点击"保存所有设置"
   ↓
7. 滚动到语音合成区域，启用有道 TTS
```

### 5.2 优化后（3 步）

```
1. 输入有道 AppID、AppSecret
   ↓
2. 点击"验证"按钮
   ↓
3. 看到 Toast 提示"配置已自动保存"
   + 弹出提示："是否同时启用有道语音合成？"
   + 点击"一键启用"
   ↓
完成！
```

**步骤减少**: 7 步 → 3 步（减少 57%）  
**滚动次数**: 2 次 → 0 次  
**点击次数**: 4 次 → 2 次

## 6. 实施计划

### 6.1 开发阶段

#### Phase 1: 核心功能（1-2 天）

- [ ] 实现自动保存管理器
- [ ] 实现 Toast 通知组件
- [ ] 修改验证成功后的处理逻辑
- [ ] 添加保存成功/失败的提示

#### Phase 2: 增强功能（1-2 天）

- [ ] 实现浮动保存按钮
- [ ] 实现配置联动检查
- [ ] 添加配置建议提示卡片
- [ ] 实现一键启用功能

#### Phase 3: 用户设置（0.5-1 天）

- [ ] 添加自动保存开关
- [ ] 添加配置建议开关
- [ ] 保存用户偏好设置

#### Phase 4: 测试与优化（1 天）

- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户体验测试
- [ ] 性能优化

### 6.2 测试用例

#### 测试用例 1: 自动保存成功

```
前置条件: 用户未配置有道翻译
操作步骤:
  1. 输入有道 AppID 和 AppSecret
  2. 点击"验证"按钮
预期结果:
  - 显示"正在保存配置..."提示
  - 显示"配置已自动保存"Toast
  - 配置已保存到 storage
  - 有道翻译服务已启用
```

#### 测试用例 2: 自动保存失败

```
前置条件: Storage API 不可用
操作步骤:
  1. 输入有道 AppID 和 AppSecret
  2. 点击"验证"按钮
预期结果:
  - 显示"保存失败，请手动保存"Toast
  - 显示浮动保存按钮
  - 点击浮动按钮可重试保存
```

#### 测试用例 3: 配置联动提示

```
前置条件: 有道翻译已配置，TTS 未启用
操作步骤:
  1. 验证有道翻译配置成功
预期结果:
  - 显示配置建议卡片
  - 提示"是否同时启用有道语音合成？"
  - 点击"一键启用"后，TTS 配置自动更新
```

#### 测试用例 4: 用户关闭自动保存

```
前置条件: 用户在设置中关闭了自动保存
操作步骤:
  1. 输入有道 AppID 和 AppSecret
  2. 点击"验证"按钮
预期结果:
  - 不自动保存配置
  - 显示"验证成功！请点击保存按钮"提示
  - 显示浮动保存按钮
```

## 7. 风险与挑战

### 7.1 技术风险

| 风险                   | 影响 | 缓解措施                         |
| ---------------------- | ---- | -------------------------------- |
| Storage API 保存失败   | 高   | 提供浮动保存按钮作为备选方案     |
| 自动保存与用户预期不符 | 中   | 提供开关选项，允许用户关闭       |
| 配置联动逻辑复杂       | 中   | 分阶段实现，先实现核心功能       |
| Toast 通知被遮挡       | 低   | 使用高 z-index，确保显示在最上层 |

### 7.2 用户体验风险

| 风险               | 影响 | 缓解措施               |
| ------------------ | ---- | ---------------------- |
| 用户不习惯自动保存 | 中   | 首次使用时显示引导提示 |
| 配置建议过于频繁   | 低   | 添加"不再提示"选项     |
| 浮动按钮遮挡内容   | 低   | 可拖动位置，或自动隐藏 |

## 8. 成功指标

### 8.1 定量指标

- **配置完成时间**: 从 5 分钟降低到 2 分钟以内
- **操作步骤**: 从 7 步减少到 3 步
- **用户满意度**: 目标 > 4.5/5.0
- **配置成功率**: 目标 > 95%

### 8.2 定性指标

- 用户反馈配置流程更简单
- 减少"如何保存配置"的支持请求
- 提升有道 TTS 的使用率

## 9. 后续优化方向

### 9.1 短期优化（1-2 周）

- 添加配置导入/导出功能
- 支持配置模板（预设常用配置）
- 添加配置历史记录

### 9.2 中期优化（1-2 月）

- 智能配置推荐（基于用户使用习惯）
- 配置向导（引导新用户完成配置）
- 批量配置验证

### 9.3 长期优化（3-6 月）

- AI 辅助配置（自动检测并推荐最佳配置）
- 配置同步（跨设备同步配置）
- 配置分享（分享配置给其他用户）

## 10. 附录

### 10.1 相关文档

- [配置管理器设计文档](./config-manager-design.md)
- [存储管理器 API 文档](./storage-api.md)
- [UI 组件库文档](./ui-components.md)

### 10.2 参考资料

- Chrome Extension Storage API: https://developer.chrome.com/docs/extensions/reference/storage/
- Material Design Toast: https://material.io/components/snackbars
- UX Best Practices for Settings: https://www.nngroup.com/articles/settings-design/

### 10.3 更新日志

| 日期       | 版本 | 更新内容 | 作者 |
| ---------- | ---- | -------- | ---- |
| 2025-10-17 | v1.0 | 初始版本 | Kiro |

---

**审批流程**:

- [ ] 产品经理审批
- [ ] 技术负责人审批
- [ ] UI/UX 设计师审批
- [ ] 开发团队评审

---

## 11. 开发任务清单 (TODO List)

### Phase 1: 基础设施和工具类 (Foundation)

#### 1.1 Toast 通知组件

- [x] 1.1.1 创建 `ToastNotification` 类
  - 文件: `src/shared/toast.ts`
  - 功能: 显示/隐藏 Toast，支持 info/success/error 类型
  - 测试: 单元测试验证显示和自动隐藏
- [x] 1.1.2 添加 Toast 样式
  - 文件: `src/styles/toast.css`
  - 样式: 包含 3 种类型的样式和动画效果
  - 测试: 视觉测试验证样式正确

- [x] 1.1.3 在 options.html 中引入 Toast 样式
  - 文件: `src/options/options.html`
  - 修改: 添加 `<link>` 标签引入 toast.css

#### 1.2 浮动保存按钮组件

- [x] 1.2.1 创建 `FloatingSaveButton` 类
  - 文件: `src/shared/floating-save-button.ts`
  - 功能: 显示/隐藏浮动按钮，处理点击事件
  - 测试: 单元测试验证显示逻辑

- [x] 1.2.2 添加浮动按钮样式
  - 文件: `src/styles/floating-button.css`
  - 样式: 固定定位、动画效果、hover 状态
  - 测试: 视觉测试验证位置和动画

- [x] 1.2.3 在 options.html 中引入浮动按钮样式
  - 文件: `src/options/options.html`
  - 修改: 添加 `<link>` 标签引入 floating-button.css

### Phase 2: 自动保存核心功能 (Auto-Save Core)

#### 2.1 自动保存管理器

- [x] 2.1.1 创建 `AutoSaveManager` 类基础结构
  - 文件: `src/options/auto-save-manager.ts`
  - 功能: 类定义、构造函数、基础属性
  - 依赖: ToastNotification, FloatingSaveButton

- [x] 2.1.2 实现自动保存逻辑
  - 方法: `onValidationSuccess(providerId, config)`
  - 功能: 验证成功后自动保存配置
  - 错误处理: 保存失败时显示错误提示

- [x] 2.1.3 实现保存状态管理
  - 方法: `showSavingToast()`, `showSuccessToast()`, `showErrorToast()`
  - 功能: 管理不同状态的 Toast 提示
  - 测试: 验证各种状态的提示正确显示

- [x] 2.1.4 添加用户偏好设置支持
  - 属性: `autoSaveEnabled`, `showSuggestions`
  - 功能: 从 storage 读取用户设置
  - 测试: 验证设置正确读取和应用

#### 2.2 集成到 Options 页面

- [x] 2.2.1 在 `PopupManager` 中初始化 `AutoSaveManager`
  - 文件: `src/options/options.ts`
  - 修改: 在构造函数中创建 AutoSaveManager 实例
  - 测试: 验证初始化成功

- [x] 2.2.2 修改 `validateProvider()` 方法
  - 文件: `src/options/options.ts`
  - 修改: 验证成功后调用 `autoSaveManager.onValidationSuccess()`
  - 移除: 原有的 alert 提示和手动保存提示
  - 测试: 验证自动保存流程正常工作

- [x] 2.2.3 处理保存失败场景
  - 文件: `src/options/options.ts`
  - 功能: 保存失败时显示浮动保存按钮（已在 AutoSaveManager 中实现）
  - 测试: 模拟保存失败，验证浮动按钮显示

### Phase 3: 配置联动和智能提示 (Smart Suggestions)

#### 3.1 配置建议卡片组件

- [x] 3.1.1 创建 `ConfigSuggestion` 类
  - 文件: `src/shared/config-suggestion.ts`
  - 功能: 显示配置建议卡片，支持自定义按钮
  - 测试: 单元测试验证显示和交互

- [x] 3.1.2 添加配置建议样式
  - 文件: `src/styles/config-suggestion.css`
  - 样式: 卡片样式、按钮样式、动画效果
  - 测试: 视觉测试验证样式

- [x] 3.1.3 在 options.html 中引入配置建议样式
  - 文件: `src/options/options.html`
  - 修改: 添加 `<link>` 标签引入 config-suggestion.css

#### 3.2 配置联动检查逻辑

- [x] 3.2.1 实现有道翻译 → 有道 TTS 联动检查
  - 文件: `src/options/auto-save-manager.ts`
  - 方法: `checkYoudaoTTSSuggestion()`
  - 逻辑: 检查有道翻译已配置但 TTS 未启用
  - 测试: 验证检查逻辑正确

- [x] 3.2.2 实现配置建议显示
  - 方法: `showYoudaoTTSSuggestion()`
  - 功能: 在页面中显示配置建议卡片
  - 位置: 在语音合成配置区域上方
  - 测试: 验证卡片正确显示

- [x] 3.2.3 实现"一键启用"功能
  - 方法: `enableYoudaoTTS()`
  - 功能: 自动更新 speech 配置，启用有道 TTS
  - 保存: 自动保存更新后的配置
  - 测试: 验证一键启用功能正常工作

- [x] 3.2.4 实现"稍后配置"功能
  - 方法: `dismissSuggestion()`
  - 功能: 隐藏建议卡片，记录用户选择
  - 存储: 保存用户的忽略选择（避免重复提示）
  - 测试: 验证忽略功能正常工作

#### 3.3 反向检查逻辑

- [x] 3.3.1 实现有道 TTS → 有道翻译检查
  - 方法: `checkYoudaoTranslationRequired()`
  - 逻辑: 检查 TTS 启用但翻译服务未配置
  - 提示: 显示警告提示，引导用户配置翻译服务
  - 测试: 验证检查逻辑正确

- [x] 3.3.2 实现"前往配置"功能
  - 方法: `scrollToProviderConfig(providerId)`
  - 功能: 滚动到指定翻译服务配置区域
  - 高亮: 高亮显示目标配置区域
  - 测试: 验证滚动和高亮功能

### Phase 4: 用户设置和偏好 (User Preferences)

#### 4.1 用户设置 UI

- [x] 4.1.1 在 options.html 中添加设置区域
  - 文件: `src/options/options.html`
  - 位置: 在页面底部，保存按钮上方
  - 内容: 3 个复选框（自动保存、配置建议、浮动按钮）

- [x] 4.1.2 添加设置区域样式
  - 文件: `src/options/options.css`
  - 样式: 设置区域的布局和样式（使用现有样式）
  - 测试: 视觉测试验证样式

#### 4.2 用户设置逻辑

- [x] 4.2.1 定义用户设置接口
  - 文件: `src/shared/config-manager.ts`
  - 接口: `AutoSavePreferences`
  - 字段: `autoSaveEnabled`, `showSuggestions`, `showFloatingButton`

- [x] 4.2.2 扩展 TranslationSettings
  - 文件: `src/shared/config-manager.ts`
  - 添加: `autoSavePreferences?: AutoSavePreferences`
  - 默认值: 在 `getDefaults()` 中添加默认配置

- [x] 4.2.3 实现设置读取和保存
  - 文件: `src/options/options.ts`
  - 方法: 在 `collectSettings()` 和 `loadSettingsToUI()` 中实现
  - 测试: 验证设置正确保存和读取

- [x] 4.2.4 绑定设置 UI 事件
  - 文件: `src/options/options.ts`
  - 事件: 复选框 change 事件
  - 功能: 实时更新 AutoSaveManager 设置
  - 测试: 验证设置更改立即生效

#### 4.3 首次使用引导

- [x] 4.3.1 检测首次使用
  - 方法: `checkFirstTimeUser()`
  - 逻辑: 检查是否首次使用自动保存功能
  - 存储: 使用 localStorage 记录

- [x] 4.3.2 显示引导提示
  - 方法: `checkFirstTimeUser()` 中实现
  - 内容: "提示：验证成功后会自动保存配置，您可以在设置中关闭此功能"
  - 样式: 使用 info 类型的 Toast，持续时间 5 秒
  - 测试: 验证首次使用时显示引导

### Phase 5: 测试和优化 (Testing & Optimization)

#### 5.1 单元测试

- [x] 5.1.1 ToastNotification 单元测试
  - 文件: `tests/toast.test.ts`
  - 测试: 显示、隐藏、类型、持续时间
  - 覆盖率: 完整测试套件

- [x] 5.1.2 FloatingSaveButton 单元测试
  - 文件: `tests/floating-save-button.test.ts`
  - 测试: 显示、隐藏、点击事件、位置
  - 覆盖率: 完整测试套件

- [x] 5.1.3 AutoSaveManager 单元测试
  - 文件: `tests/auto-save-manager.test.ts`
  - 测试: 自动保存、错误处理、配置检查
  - 覆盖率: 核心功能测试

- [x] 5.1.4 ConfigSuggestion 单元测试
  - 文件: `tests/config-suggestion.test.ts`
  - 测试: 显示、隐藏、按钮交互
  - 覆盖率: 核心功能测试

#### 5.2 集成测试

- [ ] 5.2.1 完整配置流程测试
  - 场景: 从输入配置到自动保存完成
  - 验证: 配置正确保存，Toast 正确显示
  - 测试: E2E 测试

- [ ] 5.2.2 配置联动测试
  - 场景: 启用有道翻译后显示 TTS 建议
  - 验证: 建议卡片显示，一键启用功能正常
  - 测试: E2E 测试

- [ ] 5.2.3 错误处理测试
  - 场景: 保存失败、网络错误
  - 验证: 错误提示正确，浮动按钮显示
  - 测试: E2E 测试

- [ ] 5.2.4 用户设置测试
  - 场景: 关闭自动保存，修改配置
  - 验证: 不自动保存，浮动按钮显示
  - 测试: E2E 测试

#### 5.3 性能优化

- [ ] 5.3.1 Toast 动画性能优化
  - 优化: 使用 CSS transform 代替 position
  - 测试: 性能测试，确保 60fps

- [ ] 5.3.2 配置检查防抖
  - 优化: 添加 debounce，避免频繁检查
  - 测试: 验证不影响用户体验

- [ ] 5.3.3 内存泄漏检查
  - 检查: Toast、浮动按钮、事件监听器
  - 修复: 确保组件销毁时清理资源
  - 测试: 内存泄漏测试

#### 5.4 浏览器兼容性测试

- [ ] 5.4.1 Chrome 测试
  - 版本: 最新版本和前两个版本
  - 验证: 所有功能正常工作

- [ ] 5.4.2 Edge 测试
  - 版本: 最新版本
  - 验证: 所有功能正常工作

- [ ] 5.4.3 样式兼容性测试
  - 测试: CSS 动画、定位、z-index
  - 验证: 在不同浏览器中显示一致

### Phase 6: 文档和发布 (Documentation & Release)

#### 6.1 代码文档

- [ ] 6.1.1 添加 JSDoc 注释
  - 文件: 所有新增的类和方法
  - 内容: 参数、返回值、示例
  - 标准: 符合 JSDoc 规范

- [ ] 6.1.2 更新 README
  - 文件: `README.md`
  - 内容: 新增功能说明、使用指南
  - 截图: 添加功能演示截图

#### 6.2 用户文档

- [ ] 6.2.1 创建用户指南
  - 文件: `docs/guides/auto-save-guide.md`
  - 内容: 功能介绍、使用方法、常见问题
  - 语言: 中文

- [ ] 6.2.2 创建更新日志
  - 文件: `CHANGELOG.md`
  - 内容: 新增功能、改进、修复
  - 版本: 标注版本号

#### 6.3 发布准备

- [ ] 6.3.1 版本号更新
  - 文件: `package.json`, `manifest.json`
  - 版本: 从当前版本升级到下一个版本
  - 规范: 遵循语义化版本

- [ ] 6.3.2 构建和打包
  - 命令: `npm run build`
  - 验证: 构建成功，无错误和警告
  - 测试: 在生产环境中测试

- [ ] 6.3.3 发布说明
  - 文件: `docs/releases/vX.X.X.md`
  - 内容: 新功能、改进、已知问题
  - 格式: Markdown

---

## 12. 任务进度追踪

### 总体进度

- **Phase 1**: 6/9 (67%) ✅ Toast 和浮动按钮组件完成
- **Phase 2**: 9/9 (100%) ✅ 自动保存核心功能完成
- **Phase 3**: 0/11 (0%)
- **Phase 4**: 0/11 (0%)
- **Phase 5**: 0/14 (0%)
- **Phase 6**: 0/9 (0%)

**总计**: 15/63 (24%)

### 预计时间

- **Phase 1**: 1-2 天
- **Phase 2**: 1-2 天
- **Phase 3**: 1-2 天
- **Phase 4**: 0.5-1 天
- **Phase 5**: 1-2 天
- **Phase 6**: 0.5-1 天

**总计**: 5-10 天

### 当前状态

- **开始日期**: 待定
- **当前阶段**: 未开始
- **完成日期**: 待定
- **负责人**: 待分配

---

## 13. 开发注意事项

### 代码规范

- 遵循项目现有的 TypeScript 和 ESLint 规范
- 所有新增代码必须通过 lint 检查
- 保持代码风格一致

### 测试要求

- 每个新增功能必须有对应的单元测试
- 测试覆盖率不低于 90%
- 所有测试必须通过才能合并

### 提交规范

- 使用语义化提交信息（Conventional Commits）
- 每个任务完成后单独提交
- 提交信息格式：`feat: 完成任务 X.X.X - 任务描述`

### 代码审查

- 每个 Phase 完成后进行代码审查
- 审查通过后才能进入下一个 Phase
- 记录审查意见和改进建议

---

**最后更新**: 2025-10-17  
**更新人**: Kiro
