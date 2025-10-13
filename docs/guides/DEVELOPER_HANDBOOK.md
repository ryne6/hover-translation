# 开发手册（Developer Handbook）

> 统一的工程规范、流程与最佳实践。适用于所有 Hover Translation 贡献者。

---

## 1. 工作流程

1. **计划（Plan）**
   - 明确需求来源：PRD（如 `docs/prd/PRD_TRANSLATION_ADAPTERS.md`、`docs/prd/PRD_SPEECH_SYNTHESIS.md`）或缺陷分析。
   - 拆解任务 -> 形成可执行子项；如涉及多文件/步骤，先在讨论或任务工具里同步。
   - 识别依赖：后端 API、Chrome 权限、配置变更、外部库等。

2. **实现（Build）**
   - 遵循本文档“编码规范”与“配置约定”。
   - 保持提交原子化；多功能拆分多次提交。
   - 避免在构建/测试前提交。

3. **验证（Test）**
   - 自动化：`npm test`（Vitest）。
   - 手动：参照“测试策略”章节；重点验证配置持久化、悬浮框交互、发音回退。

4. **交付（Deliver）**
   - 更新相关文档/变更日志（如适用）。
   - 在 PR / 评审中列出实现、风险、验证结果。
   - 发布前执行“发布流程”。

---

## 2. 编码规范

### 2.1 JavaScript / TypeScript

- 使用 ES modules；保持文件顶部导入有序（内建 → 外部 → 内部）。
- 避免魔法数；提取为常量或配置。
- 异步流程以 `async/await` 优先；统一错误处理并记录日志。
- DOM 交互：缓存节点引用、清理事件监听器。
- 配置/常量存放在 `src/shared/constants.js` 或专有模块。
- 日志：内容脚本与后台使用 `console` / `Logger`，带上模块前缀。
- 单元测试：
  - 使用 Vitest + jsdom。
  - Mock Chrome API / Speech API / Audio 等浏览器对象。
  - 断言副作用（如 `chrome.storage`、DOM 更新）。

### 2.2 UI / UX（悬浮框 & Popup）

- 样式：复用 `src/styles/*` 中的变量，保持深浅主题兼容。
- 悬浮框交互：
  - 内部操作（复制、发音、选中文字）不得触发插件重新翻译。
  - 发音按钮播放时添加 `.is-speaking`，结束后移除（参考 `hover-box.css`）。
  - Pronunciation：优先远程音频，失败退回 Speech Synthesis。
- 无障碍：按钮加 `aria-label`、`aria-pressed`；通知用 `role="status"`。

---

## 3. 配置与存储规范

### 3.1 存储约定

- 所有设置写入 `chrome.storage.sync`，使用命名空间键 `hoverTranslationSettings`（`STORAGE_KEYS.SETTINGS`）。
- 兼容旧版字段（如 `translationProvider`、`shortcuts`），通过 `ConfigManager.migrate` 统一转换。
- `StorageManager.getSettings()` 必须返回含 `providers`、`primaryProvider` 等关键字段，并保留旧配置。
- 保存设置时同步写入命名空间和顶级键，确保旧代码路径仍可读取。

### 3.2 修改流程

1. 评估现有数据格式 → 制定迁移策略。
2. 更新 `ConfigManager.getDefaults()` 与 `migrate()`。
3. 调整 `StorageManager` 写/读逻辑。
4. 编写/更新单测覆盖新字段 & 迁移。
5. 在 `Release Notes` / 文档中记录行为变化。

---

## 4. 测试策略

### 4.1 自动化

- `npm test`：覆盖 core utility、TextSelector、HoverBox 等模块。
- 新功能需新增单测（例如：悬浮框发音/配置回退/存储迁移）。

### 4.2 手动验证清单

| 场景 | 操作 | 期望 |
| ---- | ---- | ---- |
| 配置持久化 | 在 Options 中修改、保存、刷新 | 设置仍在；后台日志无错误 |
| 翻译流程 | 在网页选词 | 悬浮框显示译文、 loading → 结果 |
| 发音回退 | 点击发音 / Accent 按钮 | 远程音频播放，失败回退到 Speech Synthesis |
| 悬浮框选中文本 | 在悬浮框内部拖选 | 不触发新翻译、不隐藏悬浮框 |
| 通知 | 点击复制 | 右上角弹出通知，3 秒后消失 |
| 错误处理 | 禁用所有 provider | 显示错误提示并可恢复 |

更多 UI 细节可参考 `TESTING_CHECKLIST.md`。

---

## 5. 代码评审清单

- **配置**：`StorageManager` / `ConfigManager` 是否保持兼容？命名空间是否写入？
- **翻译流程**：后台是否初始化成功？遇到报错是否降级处理？
- **UI/交互**：悬浮框/Popup 是否有状态反馈、无障碍属性？
- **语音**：远程音频、Speech Synthesis、按钮状态是否完整覆盖错误路径？
- **日志**：关键路径有足够日志；无敏感信息。
- **测试**：新逻辑是否有单测？`npm test` 是否通过？必要的手动验证是否记录？

建议在 PR 模板内引用本清单关键点。

---

## 6. 发布流程

1. `npm run build`（生成 `dist/*`）。
2. 进入 Chrome → `chrome://extensions/` → 打包好的 `dist/` 目录 → 加载待发布版本。
3. 手动走“测试策略”中的关键场景。
4. 更新 `RELEASE_NOTES`、`CHANGELOG`（版本号、主要变更、已知问题）。
5. 归档构建产物（如 `hover-translation.zip`）。

---

## 7. 常见问题（Gotchas）

- **Speech Synthesis 兼容性**：部分浏览器无声/缺少 Voice；点击发音需提示“不支持语音朗读”。
- **远程音频跨域**：需设置 `audio.crossOrigin = 'anonymous'`，并缓存 Blob（见 `HoverBox#getAudioSource`）。
- **Chrome Storage 超配额**：注意 `sync` 容量限制；缓存/历史采用 `chrome.storage.local` 并限制条数。
- **内容脚本选择冲突**：`TextSelector` 要过滤来自 `.hover-translation-box` 的交互，避免无限触发。
- **Service Worker 生命周期**：后台 `BackgroundService` 需要在 `storage.onChanged` 里重跑初始化（见 `handleStorageChange`）。

---

## 8. 后续改进

- 将本文档纳入 PR 模板检查清单。
- 构建自动化（CI）接入 lint/test。
- 逐步淘汰旧检查清单（`*_CHECKLIST.md`）的重复内容，仅保留补充说明。

--- 

> 任何规范上的更新，请优先调整本手册并在团队内同步。在 PR 中引用对应章节，确保信息统一。 
