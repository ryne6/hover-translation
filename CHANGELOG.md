# 更新日志

## v0.1.0 (2025-10-11)

### 🎉 初始版本

#### ✨ 核心功能
- 智能文本选择检测
- 自动语言识别
- 实时翻译（Google 翻译 / 百度翻译）
- 优雅的悬浮框显示
- 翻译结果缓存
- 翻译历史记录（最多 100 条）
- 一键复制翻译结果

#### 🎨 用户界面
- 现代化的弹出窗口设置面板
- 悬浮翻译框（带动画效果）
- 深色/浅色主题支持
- 响应式设计

#### 🌐 支持的语言
- 中文（简体）、英语、日语、韩语
- 法语、德语、西班牙语、俄语
- 意大利语、葡萄牙语、阿拉伯语、印地语

#### 🔧 技术实现
- Chrome Extension Manifest V3
- ES Modules 支持
- Vite 构建工具
- Vitest 测试框架（68 个测试用例全部通过）

### 🐛 已修复的问题

#### 构建和打包
- ✅ 修复 ES module 导入错误
- ✅ 修复 Chrome Storage API 未定义错误
- ✅ 修复 CSS 样式未加载问题
- ✅ 修复 popup.css 路径错误
- ✅ 移除 CSS @import（改为 manifest 多文件引入）

#### 代码质量
- ✅ 添加 Chrome API 可用性检查（所有调用点）
- ✅ 改进错误处理和日志
- ✅ 修复测试中的 done() callback 弃用警告
- ✅ 修复语言检测优先级（日文假名优先于汉字）

#### 样式和布局
- ✅ 确保所有 CSS 文件正确复制到 dist 目录
- ✅ 修复样式文件路径引用
- ✅ content.css 正确加载 variables.css 和 hover-box.css
- ✅ popup.css 正确加载

### 📦 打包文件

**文件名**: `hover-translation.zip` (28 KB)

**包含内容**:
```
dist/
├── manifest.json           # 扩展配置（Manifest V3 + ES modules）
├── popup.html             # 设置面板 HTML
├── content.js             # 内容脚本 (19.10 kB)
├── background.js          # 后台服务 (6.56 kB)
├── popup.js               # 弹出窗口脚本 (13.51 kB)
├── storage.js             # 存储管理 (8.14 kB)
├── api-manager.js         # API 管理 (4.55 kB)
├── styles/
│   ├── variables.css      # CSS 变量
│   ├── hover-box.css      # 悬浮框样式
│   ├── content.css        # 内容页面样式
│   └── popup.css          # 弹出窗口样式
└── assets/
    └── icons/             # 扩展图标 (16/32/48/128 px + SVG)
```

### 🧪 测试覆盖

**测试文件**: 4 个
**测试用例**: 68 个（全部通过 ✅）

- `simple.test.js` - 5 个测试
- `text-selector.test.js` - 17 个测试
- `utils.test.js` - 27 个测试
- `hover-box.test.js` - 19 个测试

**测试覆盖模块**:
- 文本选择器
- 悬浮框组件
- 工具函数（防抖、节流、语言检测、位置计算等）
- 通知系统

### 📝 配置文件

#### manifest.json 关键配置
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js",
    "type": "module"  // 支持 ES modules
  },
  "content_scripts": [{
    "css": [
      "styles/variables.css",
      "styles/hover-box.css",
      "styles/content.css"
    ]  // 按顺序加载样式
  }]
}
```

#### vite.config.js 关键配置
- 输出格式: ES modules (`format: 'es'`)
- 不压缩代码 (`minify: false`) 便于调试
- 自动复制静态资源（HTML、CSS、图标等）

### 🚀 使用方法

1. **安装扩展**
   ```
   打开 chrome://extensions/
   开启"开发者模式"
   加载 dist/ 目录
   ```

2. **基本使用**
   - 在任何网页选择文本
   - 自动显示翻译结果
   - 点击复制按钮复制译文

3. **设置配置**
   - 点击工具栏图标打开设置
   - 选择源语言和目标语言
   - 选择翻译服务提供商
   - 查看翻译历史

### 🔜 未来计划

- [ ] 文本朗读（TTS）功能
- [ ] 收藏翻译结果
- [ ] 使用统计和分析
- [ ] 自定义主题颜色
- [ ] 支持更多翻译服务
- [ ] 导出/导入设置
- [ ] 快捷键自定义
- [ ] 批量翻译

### 🙏 致谢

感谢所有测试和反馈的用户！

---

**下载**: [hover-translation.zip](./hover-translation.zip)  
**文档**: [INSTALLATION.md](./INSTALLATION.md)  
**许可**: MIT License
