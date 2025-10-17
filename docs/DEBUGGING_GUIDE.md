# 调试指南

## 问题 1: 验证有道 API 后没有弹出 TTS 建议

### 可能的原因

1. **建议已被忽略**
   - 如果之前点击过"稍后配置"或关闭按钮，建议会被记录到 localStorage
   - 解决方法：清除 localStorage

2. **语音合成区域未找到**
   - 代码需要找到 `#page-speech` 页面
   - 解决方法：确保在 Options 页面

3. **自动保存未启用**
   - 如果关闭了自动保存，不会触发配置建议
   - 解决方法：启用自动保存

### 调试步骤

1. **打开浏览器开发者工具**
   ```
   F12 或 右键 → 检查
   ```

2. **清除已忽略的建议**
   在 Console 中执行：
   ```javascript
   localStorage.removeItem('dismissedSuggestions');
   location.reload();
   ```

3. **检查自动保存是否启用**
   在 Console 中执行：
   ```javascript
   chrome.storage.sync.get(null, (data) => {
     console.log('Settings:', data);
     console.log('AutoSave enabled:', data.settings?.autoSavePreferences?.autoSaveEnabled);
     console.log('Show suggestions:', data.settings?.autoSavePreferences?.showSuggestions);
   });
   ```

4. **手动触发建议检查**
   在 Console 中执行：
   ```javascript
   // 获取 PopupManager 实例（如果可访问）
   // 或者重新验证有道配置
   ```

5. **查看控制台日志**
   - 查找 `[AutoSaveManager]` 开头的日志
   - 查找错误信息

### 预期行为

验证有道翻译成功后：
1. 显示 Toast："⏳ 正在保存配置..."
2. 显示 Toast："✅ 配置已自动保存"
3. 延迟 500ms 后显示配置建议卡片
4. 卡片内容："您已启用有道翻译服务，是否同时启用有道语音合成功能？"

## 问题 2: 手动启用 TTS 后点击翻译显示翻译失败

### 可能的原因

1. **有道 API 配置问题**
   - AppID 或 AppSecret 不正确
   - API 配额已用完
   - 网络连接问题

2. **配置未正确保存**
   - speech 配置未保存到 storage
   - background 服务未重新加载配置

3. **TTS 配置影响了翻译**
   - 不太可能，TTS 和翻译是独立的

### 调试步骤

1. **检查配置是否正确保存**
   在 Console 中执行：
   ```javascript
   chrome.storage.sync.get(null, (data) => {
     console.log('Complete settings:', JSON.stringify(data, null, 2));
     console.log('Youdao config:', data.settings?.providers?.youdao);
     console.log('Speech config:', data.settings?.speech);
   });
   ```

2. **检查 Background 服务状态**
   - 打开扩展管理页面：`chrome://extensions/`
   - 找到你的扩展
   - 点击"Service Worker"或"背景页"
   - 查看控制台日志

3. **测试翻译 API**
   在 Background 控制台中执行：
   ```javascript
   chrome.runtime.sendMessage({
     action: 'translate',
     text: 'hello',
     sourceLang: 'en',
     targetLang: 'zh-CN'
   }, (response) => {
     console.log('Translation response:', response);
   });
   ```

4. **检查网络请求**
   - 在 Network 标签中查看请求
   - 查找有道 API 的请求
   - 检查请求参数和响应

5. **查看错误信息**
   - 在 Console 中查找红色错误信息
   - 特别注意 API 相关的错误

### 预期行为

启用 TTS 后：
1. `settings.speech.enabled` 应该为 `true`
2. `settings.speech.provider` 应该为 `'youdao'`
3. 翻译功能应该不受影响（TTS 和翻译是独立的）

## 通用调试技巧

### 1. 重新加载扩展

```
1. 打开 chrome://extensions/
2. 找到你的扩展
3. 点击刷新图标 🔄
4. 重新打开 Options 页面
```

### 2. 清除所有数据

在 Console 中执行：
```javascript
// 清除 storage
chrome.storage.sync.clear(() => {
  console.log('Storage cleared');
});

// 清除 localStorage
localStorage.clear();

// 重新加载页面
location.reload();
```

### 3. 查看完整配置

在 Console 中执行：
```javascript
chrome.storage.sync.get(null, (data) => {
  console.log('=== Complete Configuration ===');
  console.log(JSON.stringify(data, null, 2));
  
  console.log('\n=== Youdao Provider ===');
  console.log('Enabled:', data.settings?.providers?.youdao?.enabled);
  console.log('API Key:', data.settings?.providers?.youdao?.apiKey ? '***' : 'NOT SET');
  console.log('API Secret:', data.settings?.providers?.youdao?.apiSecret ? '***' : 'NOT SET');
  
  console.log('\n=== Speech Settings ===');
  console.log('Enabled:', data.settings?.speech?.enabled);
  console.log('Provider:', data.settings?.speech?.provider);
  
  console.log('\n=== AutoSave Preferences ===');
  console.log('AutoSave:', data.settings?.autoSavePreferences?.autoSaveEnabled);
  console.log('Suggestions:', data.settings?.autoSavePreferences?.showSuggestions);
});
```

### 4. 启用详细日志

在 Console 中执行：
```javascript
// 启用详细日志
localStorage.setItem('debug', 'true');

// 重新加载
location.reload();
```

## 常见问题解答

### Q: 为什么配置建议不显示？

A: 检查以下几点：
1. 自动保存是否启用
2. 配置建议是否启用
3. 建议是否已被忽略（检查 localStorage）
4. 是否在正确的页面（Options 页面）

### Q: 为什么翻译失败？

A: 检查以下几点：
1. 有道 API 配置是否正确
2. 网络连接是否正常
3. API 配额是否充足
4. Background 服务是否正常运行

### Q: 如何重置所有设置？

A: 在 Options 页面点击"重置设置"按钮，或在 Console 中执行：
```javascript
chrome.storage.sync.clear();
localStorage.clear();
location.reload();
```

## 获取帮助

如果问题仍然存在：

1. **收集信息**
   - 浏览器版本
   - 扩展版本
   - 错误信息（截图或文本）
   - Console 日志

2. **提供配置**
   ```javascript
   chrome.storage.sync.get(null, (data) => {
     // 移除敏感信息
     const safe = JSON.parse(JSON.stringify(data));
     if (safe.settings?.providers) {
       Object.keys(safe.settings.providers).forEach(key => {
         if (safe.settings.providers[key].apiKey) {
           safe.settings.providers[key].apiKey = '***';
         }
         if (safe.settings.providers[key].apiSecret) {
           safe.settings.providers[key].apiSecret = '***';
         }
       });
     }
     console.log(JSON.stringify(safe, null, 2));
   });
   ```

3. **提交 Issue**
   - 包含上述信息
   - 描述重现步骤
   - 附上截图

---

**最后更新**: 2025-10-17
