# UI 配色方案重设计 - 实施任务

- [x] 1. 更新 CSS 变量系统
  - 更新 `src/styles/variables.css`，替换所有基础色变量为新的 Tailwind Gray 色板
  - 添加完整的 9 级灰阶变量（gray-50 到 gray-900）
  - 添加品牌色变量（brand-50 到 brand-900）
  - 添加功能色变量（success, error, warning, info）
  - 更新语义化颜色映射（text-_, bg-_, border-\*）
  - 保留旧变量名作为别名，确保向后兼容
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [x] 2. 更新悬浮翻译框样式
  - 更新 `src/styles/hover-box.css` 中的翻译框背景色为纯白（#FFFFFF）
  - 更新边框颜色为 `--border-light` (#E5E7EB)
  - 优化阴影效果，使用更柔和的多层阴影
  - 更新头部工具栏背景为纯白，增强视觉突出度
  - 更新原文区域背景为 `--bg-secondary` (#F9FAFB)
  - 更新译文区域背景为纯白，使其成为视觉焦点
  - 更新所有文本颜色，确保对比度符合 WCAG AA 标准
  - 更新底部信息栏背景为 `--bg-secondary`
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. 优化按钮和交互元素样式
  - 更新 `src/styles/hover-box.css` 和 `src/styles/floating-button.css` 中的按钮样式
  - 更新按钮默认状态：白色背景 + 灰色边框（#D1D5DB）
  - 更新按钮悬停状态：浅灰背景（#F9FAFB）+ 深色边框
  - 更新按钮激活状态：添加 scale(0.95) 效果
  - 更新按钮聚焦状态：使用品牌色轮廓（2px solid）
  - 调整按钮圆角为 6px，符合现代设计趋势
  - 优化按钮图标颜色对比度
  - 添加成功状态样式（绿色背景 + 边框）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. 更新全局内容样式
  - 更新 `src/styles/content.css` 中的通知样式
  - 更新 Toast 通知背景为纯白
  - 更新 Toast 边框和阴影效果
  - 为不同状态的 Toast 添加彩色左边框（success, error, warning, info）
  - 更新选择高亮样式，使用更柔和的背景色
  - 确保所有文本颜色符合可访问性标准
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [ ] 5. 添加深色主题支持
  - 在 `src/styles/variables.css` 中添加 `[data-theme="dark"]` 选择器
  - 定义深色主题的基础色板（反转灰阶）
  - 定义深色主题的语义化颜色
  - 调整深色主题的品牌色（使用更亮的 brand-400）
  - 确保深色主题的对比度符合 WCAG 标准
  - 更新所有组件样式以支持深色主题
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. 实现主题管理器
  - 创建 `src/shared/theme-manager.ts` 文件
  - 实现 `ThemeManager` 类，包含主题切换逻辑
  - 实现系统主题自动检测（`prefers-color-scheme`）
  - 实现主题持久化（保存到 chrome.storage）
  - 实现主题切换时的平滑过渡动画
  - 添加主题切换事件监听和回调
  - 导出主题管理器单例供其他模块使用
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. 添加主题切换 UI
  - 更新 `src/options/options.html`，添加主题选择器组件
  - 更新 `src/options/options.ts`，集成主题管理器
  - 添加三个主题选项：浅色、深色、跟随系统
  - 实现主题实时预览功能
  - 添加主题切换的视觉反馈
  - 更新设置页面样式以支持新配色方案
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. 更新其他页面样式
  - 更新 `src/styles/popup.css` 中的弹窗样式
  - 更新 `src/styles/options.css` 中的设置页面样式
  - 更新 `src/styles/toast.css` 中的通知样式
  - 确保所有页面使用新的配色方案
  - 确保所有页面支持深色主题
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 9. 可访问性测试和优化
  - 使用对比度检查工具验证所有颜色组合
  - 确保所有文本对比度 >= 4.5:1（WCAG AA）
  - 确保大文本对比度 >= 3:1（WCAG AA）
  - 测试键盘导航，确保焦点状态清晰可见
  - 测试屏幕阅读器兼容性
  - 添加高对比度模式支持（`prefers-contrast: high`）
  - 验证减少动画模式支持（`prefers-reduced-motion`）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10. 浏览器兼容性测试
  - 在 Chrome 90+ 上测试所有功能
  - 在 Firefox 88+ 上测试所有功能
  - 在 Safari 14+ 上测试所有功能
  - 在 Edge 90+ 上测试所有功能
  - 验证 CSS 变量降级方案
  - 测试不同屏幕尺寸的响应式表现
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 11. 性能优化和测试
  - 测量主题切换的性能开销
  - 优化 CSS 变量的使用，避免不必要的重绘
  - 添加主题切换时的过渡优化（禁用动画避免闪烁）
  - 测试大量文本时的渲染性能
  - 使用 Chrome DevTools 分析性能瓶颈
  - _Requirements: 1.1, 5.2_

- [ ] 12. 文档更新和发布准备
  - 更新 README.md，添加新配色方案的说明
  - 创建迁移指南，说明配色变更
  - 更新截图和演示图片
  - 准备发布说明（Release Notes）
  - 更新版本号到 0.3.0
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
