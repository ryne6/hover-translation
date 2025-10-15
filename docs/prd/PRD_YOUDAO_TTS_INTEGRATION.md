# Hover Translation PRD - 有道语音合成集成

## 背景
- 当前悬浮框语音朗读依赖浏览器 `speechSynthesis`，在用户设备/浏览器禁用、离线或发音质量较差时体验不稳定。
- 有道翻译已作为文字翻译提供商接入，平台提供 TTS API，可统一账号管理与计费。
- 用户反馈希望在中文场景具备更自然的朗读和多音色选择，以满足学习与专业阅读需求。

## 目标
1. 为翻译结果提供稳定、高质量的云端语音合成输出。
2. 支持选择有道 TTS 的音色、语速、音量等核心参数，并提供回放控制。
3. 在无网络或请求失败时安全回退到浏览器语音合成，确保功能兜底可用。

## 非目标
- 不在本版本支持批量离线缓存或下载语音。
- 不提供多段文本拼接与字幕同步。
- 不实现跨设备的语音历史存储。

## 用户故事
- 作为语言学习者，我希望点击“朗读”时能听到自然的中文女声，便于跟读。
- 作为资讯阅读者，我希望可以切换不同音色或调节语速，以适应不同场景。
- 作为海外用户，当网络不佳或 API 失败时，我仍希望能听到基本朗读而不报错。

## 使用场景
- 悬浮翻译弹窗中的“朗读原文”按钮。
- 未来扩展至翻译历史列表、选中即朗读等入口（为下一阶段预留）。

## 功能需求
1. **配置管理**
   - 在设置页新增“语音合成”模块，包含：
     - 启用有道 TTS 开关。
     - appKey / appSecret 输入项（沿用现有安全校验流程）。
     - 下拉选择发音人 `voiceName`（至少列出常见语种/音色）。
     - 语速 `speed`、音量 `volume`、格式 `format`（默认 mp3）等可选项。
   - 所有配置保存在 `chrome.storage.sync` 同命名空间下，并参与现有校验。

2. **调用流程**
   - 悬浮框点击朗读时：
     1. 若启用有道 TTS，则调用后台 `speech.synthesize`（新 action）。
     2. 后台根据文本、配置生成签名，请求 `https://openapi.youdao.com/ttsapi`。
     3. 成功时返回音频二进制（blob url/base64）供前端播放。
     4. 失败时记录错误，自动回退到浏览器 `speechSynthesis`。
   - 请求参数遵循官方文档：
     - 必填：`q`, `appKey`, `salt`, `sign`, `signType=v3`, `curtime`, `voiceName`.
     - 可选：`format=mp3`, `speed`, `volume`, `pitch`（若文档支持）, `sampleRate`。
     - 签名：`sign = sha256(appKey + input + salt + curtime + appSecret)`，其中 `input` 需执行 20 字符截断规则。
     - `q` UTF-8 长度上限 2048，发送前 URL encode。
   - 响应：
     - `Content-Type: audio/mp3` 视为成功，直接传递音频数据。
     - `Content-Type: application/json` 解析错误码（附带提示）。

3. **播放体验**
   - 音频播放成功时，展示“播放中”状态，支持停止、重复播放。
   - 回退逻辑保证重复点击不会堆叠多个音频实例。
   - 失败弹出通知提示原因（如凭证错误、文本过长、频率限制）。

4. **权限与安全**
   - 不新增额外 host 权限，沿用 `https://openapi.youdao.com/*`。
   - 对敏感配置做空值校验；签名计算在后台执行，前端不暴露 appSecret。

5. **统计与日志**
   - 在 `StatsManager` 中记录 TTS 请求量、成功率、平均时长，以便扩展 Dashboard。
   - 错误日志包含 errorCode 与消息，便于定位。

## 技术方案
- **架构扩展**
  - 新增 `src/tts` 模块：
    - `interfaces`：定义 `ITTSProvider`, `TTSSynthesisRequest`, `TTSSynthesisResponse`.
    - `providers/YoudaoTTSProvider`：封装请求、签名、错误映射。
    - `TTSManager`：管理启用的 TTS 服务，提供 `synthesize()` 接口，内建缓存（可选）。
  - 后台 `APIManager` 新增 `synthesizeSpeech()` 调用并暴露给 `background.ts` 消息处理。
  - 内容脚本 `hover-box` 更新播放逻辑：先请求后台音频 Blob -> 创建 `Audio` 对象 -> 播放；失败回退。

- **签名实现**
  - 复用现有 `crypto.ts`（已支持 sha256、随机 salt）生成签名。
  - 生成 `salt = randomHex(16)`，`curtime = Math.floor(Date.now()/1000)`。
  - `input` 逻辑与有道翻译 V3 保持一致，可共享工具方法。

- **网络处理**
  - 使用 `fetch` POST `application/x-www-form-urlencoded`。
  - 将二进制响应转为 `ArrayBuffer` -> `Blob` -> `ObjectURL`。
  - 注意清理 URL，防止内存泄漏。

- **Fallback 策略**
  - 429/5xx/网络错误：记录错误后触发内置 `speechSynthesis`。
  - 用户主动关闭声音或多次点击时停止当前播放并中止请求（AbortController）。

## API 限制与配置（来源：有道文档）
- 请求地址：`https://openapi.youdao.com/ttsapi`
- 文本长度：UTF-8 编码不超过 2048 字符。
- 签名：`signType = v3`，`sign = sha256(appKey + input + salt + curtime + appSecret)`。
- 发音人示例：`youxiaoqin`、`youxiaozhi`、`youxiaoxun` 等（中文男女声均有）。
- 语速范围：`0.5` ~ `2.0`；音量范围：`0.5` ~ `5.0`；默认 `1.0`。
- 返回格式：成功为 `audio/mp3`，失败 JSON 包含 `errorCode`。

## 验收标准
1. 配置正确时，点击朗读播放云端音频，无明显延迟（<1.5s）并可连续播放。
2. 配置缺失或签名错误时，UI 提示“语音合成失败”，并自动回退到浏览器朗读。
3. Text 长度 >2048 时提示用户缩短文本，不发起请求。
4. 用户调整音色/语速后再次播放生效。
5. 日志中记录 TTS 请求次数、成功率，可在调试面板输出。

## 风险与缓解
- **网络延迟/失败**：加入超时与重试一次，提供本地 fallback。
- **配额或计费超限**: 捕获特定错误码（104, 114 等），提示用户检查配额。
- **密钥泄露**：确保秘钥仅保存在本地同步存储+后台使用；提示用户勿分享。
- **文件体积**：长文本生成音频较大，需限制长度并提供进度提示。

## 时间预估（理想工时）
1. 方案验证与接口封装：1.5 天
2. 后台消息链路与统计：1 天
3. 前端 UI & 播放流程：1 天
4. 测试（单元 + 手动）与文档：1 天

## 后续可选项
- 支持缓存最近播放音频以减少重复请求。
- 扩展多语种发音与自动匹配 voiceName。
- 允许用户导出音频或在历史记录中重播。

