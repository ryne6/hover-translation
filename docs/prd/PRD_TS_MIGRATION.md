# PRD: TypeScript 全量迁移收尾

## 背景

- 核心业务逻辑、后台服务与共享模块已具备 TypeScript 版本，但仍通过 `.js` 桥接文件导出，实际打包入口仍然指向旧的 JavaScript 文件。
- `translation/utils` 目录保持在 JavaScript，实现无法享受类型约束；同时测试代码依旧引用旧接口。
- 构建脚本与 Vite 配置混用 `.js`/`.ts` 入口，`allowJs` 长期开启，导致迁移状态不清晰、类型校验效果有限。

## 目标

1. **使用 TypeScript 源码作为唯一运行时代码**：移除 `.js` 桥接入口。
2. **迁移剩余工具与测试覆盖**：`translation/utils` 与相关单元测试完全转为 TypeScript，并修正依赖。
3. **收紧构建与编译配置**：构建脚本、Vite 入口与 `tsconfig` 与新的 TypeScript 结构对齐，开启严格类型约束。

## 范围

- `src/content`, `src/background`, `src/options`, `src/popup` 入口文件。
- `src/translation/utils` 工具模块与对应导出。
- `tests` 目录中的相关测试文件。
- 构建脚本 `build.js`、`vite.config.js`、`tsconfig.json`。

## 交付标准

- `npm run build`、`npm run type-check`、`npm run test` 均通过。
- 源码中不再出现仅用于桥接 TS 的 `.js` 文件。
- `translation` 目录的公共导出仍能被外部引用，类型信息完整。
- PRD 中的 Todo List 项全部勾选。

## 计划

1. **入口对齐**  
   - 更新打包脚本和 Vite 配置指向 `.ts` 源文件。  
   - 移除 `src/content/*.js` 等桥接文件，并修正所有引用。
2. **工具与测试迁移**  
   - 将 `src/translation/utils` 目录迁移至 TypeScript。  
   - 修正受影响模块的导入路径与类型声明。  
   - 将相关单元测试改为 TypeScript 或在保留 JS 情况下补充类型校验（`ts-jest` 风格）并更新引用。
3. **类型与构建收敛**  
   - 调整 `tsconfig.json`（关闭 `allowJs`、更新 include/exclude）。  
   - 校验 `npm run type-check`、`npm run test`、`npm run build` 并在 PRD 中记录结果。

## Todo List

- [x] 更新 `build.js` 和 `vite.config.js` 以使用 `.ts` 入口，同时确保输出保持不变。
- [x] 移除 `src/content/*.js` 等桥接文件，修正所有引用与导出路径。
- [x] 将 `src/translation/utils` 目录迁移到 TypeScript，并更新 `src/translation/index.ts` 导出。
- [x] 调整/迁移相关测试，确保引用新的 TypeScript 源并通过测试。
- [x] 收紧 `tsconfig.json` 配置并完成一次 `type-check`、`test`、`build` 验证。

## 验证记录

- `npm run type-check`（串联检查 `tsconfig.json`、`tsconfig.tests.json`、`tsconfig.node.json`）
- `npm run test`
- `npm run build` (通过 `build.mts` + `ts-node/esm`)
