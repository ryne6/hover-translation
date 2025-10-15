# 修复总结

## 问题 1: 图标文件路径错误

### 问题描述
```
GET chrome-extension://kmhjjfelnkmhkjlchogjpglfojigniaj/assets/icons/copy.svg net::ERR_FILE_NOT_FOUND
```

### 解决方案
修改了 `getIconUrl` 方法中的路径处理逻辑：

**修改前:**
```typescript
return `/assets/icons/${filename}`;
```

**修改后:**
```typescript
return `./assets/icons/${filename}`;
```

### 原因分析
在 Chrome 扩展环境中，相对路径应该使用 `./` 前缀而不是 `/` 前缀，以确保正确的资源加载。

## 问题 2: 隐藏美音/英音和本地播放功能

### 问题描述
用户要求隐藏美音/英音发音功能和本地播放功能，因为现在有了 TTS 语音合成功能。

### 解决方案

#### 1. 隐藏 HTML 中的发音部分
```html
<!-- 发音功能已隐藏，使用 TTS 语音合成替代 -->
<!-- <div class="pronunciation-section" style="display: none;">
  <div class="pronunciation-content"></div>
</div> -->
```

#### 2. 注释掉发音相关的方法调用
```typescript
// 发音功能已隐藏，使用 TTS 语音合成替代
// this.renderPronunciation(translationData);
```

#### 3. 注释掉发音相关的方法实现
- `renderPronunciation()` - 渲染发音界面
- `handleAccentPronounce()` - 处理口音发音
- `playPronunciationEntry()` - 播放发音音频

#### 4. 简化语音按钮点击处理
**修改前:** 有道 TTS + 浏览器原生语音回退
**修改后:** 仅使用有道 TTS，失败时显示错误提示

```typescript
async handleSoundButtonClick(): Promise<void> {
  // ... 省略部分代码 ...
  
  // 使用有道 TTS 进行语音合成
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'synthesizeSpeech',
      text: text,
      options: {
        voiceName: this.getPreferredVoiceName(),
        speed: '1.0',
        volume: '1.0',
        format: 'mp3'
      }
    });

    if (response?.success) {
      await this.playYoudaoAudio(response.data, this.soundBtn);
      return;
    } else {
      showNotification('语音合成失败: ' + (response?.error || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('有道 TTS 失败:', error);
    showNotification('语音合成服务不可用', 'error');
  }
}
```

#### 5. 注释掉未使用的常量
```typescript
// 发音功能已隐藏，使用 TTS 语音合成替代
// const PRONUNCIATION_LOADING_HTML = '<div class="pronunciation-loading">正在加载音标...</div>';
```

## 修改的文件

### `/src/content/hover-box.ts`
- 修复了图标路径问题
- 隐藏了发音相关的 HTML 结构
- 注释掉了发音相关的方法和逻辑
- 简化了语音按钮的处理逻辑
- 移除了浏览器原生语音的回退机制

## 功能变化

### 移除的功能
1. **美音/英音发音选择** - 不再显示发音选项按钮
2. **音标显示** - 不再显示 IPA 音标
3. **本地音频播放** - 不再使用外部音频 URL
4. **浏览器原生语音回退** - 不再回退到浏览器语音合成

### 保留的功能
1. **有道 TTS 语音合成** - 主要语音功能
2. **语音按钮** - 点击播放语音
3. **语音状态指示** - 播放时的按钮状态
4. **错误处理** - TTS 失败时的错误提示

## 用户体验改进

1. **界面更简洁** - 移除了复杂的发音选择界面
2. **功能更统一** - 所有语音功能都通过 TTS 实现
3. **错误提示更明确** - TTS 失败时提供清晰的错误信息
4. **性能更好** - 减少了不必要的网络请求和音频加载

## 测试建议

1. **图标加载测试** - 验证复制按钮图标正常显示
2. **TTS 功能测试** - 验证语音合成功能正常工作
3. **错误处理测试** - 验证 TTS 失败时的错误提示
4. **界面测试** - 验证发音相关界面已隐藏

## 注意事项

1. 所有被注释的代码都保留了，以便将来需要时可以快速恢复
2. 保留了发音相关的数据结构和接口，确保代码的向后兼容性
3. 错误处理更加明确，用户能够清楚了解 TTS 服务的状态
