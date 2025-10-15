# 环境变量配置

本项目使用环境变量来存储敏感的 API 密钥，确保这些信息不会被提交到版本控制系统中。

## 设置步骤

1. 复制环境变量模板文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的有道 API 密钥：
   ```bash
   # 有道翻译 API 配置
   YOUDAO_APP_KEY=your_youdao_app_key_here
   YOUDAO_APP_SECRET=your_youdao_app_secret_here

   # 有道 TTS API 配置
   YOUDAO_TTS_APP_KEY=your_youdao_tts_app_key_here
   YOUDAO_TTS_APP_SECRET=your_youdao_tts_app_secret_here
   ```

## 获取有道 API 密钥

1. 访问 [有道智云](https://ai.youdao.com/)
2. 注册并登录账号
3. 创建应用并获取 App Key 和 App Secret
4. 将密钥填入 `.env` 文件中

## 注意事项

- `.env` 文件已被添加到 `.gitignore` 中，不会被提交到 git
- 请勿将真实的 API 密钥提交到版本控制系统
- 如果 `.env` 文件不存在，测试将使用默认的测试密钥（仅用于测试，不适用于生产环境）

## 测试

运行测试时，系统会自动加载 `.env` 文件中的环境变量：

```bash
npm test
```

如果环境变量未设置，测试将使用默认的测试密钥。
