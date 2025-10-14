# Hover Translation PRD - 版本与运营对齐

## 背景
- v0.2.0 已发布但代码库仍保留 v0.1.0 版本号，存在分发风险。
- Manifest 权限未覆盖新接入的翻译服务域名，实际使用会报错。
- 国产翻译服务（百度 / 有道 / 腾讯）采用临时签名方案，存在安全和失败风险。
- 多服务降级与缓存机制尚无系统测试，可靠性无法量化。
- Popup 新 UI 通过 `@ts-nocheck` 绕过类型检查，后续维护成本高。

## 目标
- 完成版本信息与权限对齐，确保浏览器安装版本正确。
- 提升多翻译服务的稳定性与安全性。
- 为关键调度逻辑补齐自动化测试，降低回归风险。
- 让 Popup 代码重新通过 TypeScript / ESLint 检查。

## 范围
- 仅涉及前端仓库；不改动后台服务接口协议。
- 实施范围覆盖 `package.json`、`manifest.json`、翻译适配器、测试、Popup。

## TODO
- [x] 对齐版本号到 v0.2.0（package.json、package-lock.json、manifest、显示用 README 等）。
- [x] 更新 manifest host_permissions 以覆盖所有新翻译服务域。
- [x] 为百度 / 有道 / 腾讯翻译实现正式签名算法，引入通用加密工具与配置管理。
- [x] 为 TranslationManager 核心逻辑补充 Vitest 覆盖（缓存命中、降级、并行翻译、统计）。
- [x] 移除 popup `@ts-nocheck`，拆分为具备类型定义的模块并通过 Lint/TS 检查。
