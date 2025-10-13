const { defineConfig } = require('vite');
const { resolve } = require('path');
const { copyFileSync, mkdirSync, existsSync, writeFileSync } = require('fs');

// 为每个入口创建独立的构建配置
const createConfig = (input, output, format = 'iife') => ({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input,
      output: {
        entryFileNames: output,
        format,
        inlineDynamicImports: true // 将所有依赖打包到单个文件
      }
    }
  }
});

module.exports = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.js'),
        background: resolve(__dirname, 'src/background/background.js'),
        popup: resolve(__dirname, 'src/popup/popup.js')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        // 为每个文件创建独立的 IIFE
        inlineDynamicImports: true
      },
      // 为每个入口创建独立的 bundle
      preserveEntrySignatures: false
    }
  },
  plugins: [
    // 自定义插件：复制 Chrome 扩展必需的文件
    {
      name: 'copy-chrome-extension-files',
      writeBundle() {
        // 复制 manifest.json
        copyFileSync('src/manifest.json', 'dist/manifest.json');
        
        // 复制 popup.html
        copyFileSync('src/popup/popup.html', 'dist/popup.html');
        
        // 复制样式文件
        if (!existsSync('dist/styles')) {
          mkdirSync('dist/styles', { recursive: true });
        }
        copyFileSync('src/styles/variables.css', 'dist/styles/variables.css');
        copyFileSync('src/styles/hover-box.css', 'dist/styles/hover-box.css');
        copyFileSync('src/styles/content.css', 'dist/styles/content.css');
        copyFileSync('src/popup/popup.css', 'dist/styles/popup.css');
        
        // 复制资源文件
        if (!existsSync('dist/assets')) {
          mkdirSync('dist/assets', { recursive: true });
        }
        if (!existsSync('dist/assets/icons')) {
          mkdirSync('dist/assets/icons', { recursive: true });
        }
        if (existsSync('assets/icons/icon.svg')) {
          copyFileSync('assets/icons/icon.svg', 'dist/assets/icons/icon.svg');
        }
        
        // 复制图标文件（如果存在）
        const iconSizes = [16, 32, 48, 128];
        iconSizes.forEach(size => {
          const sourcePath = `assets/icons/icon-${size}.png`;
          const destPath = `dist/assets/icons/icon-${size}.png`;
          if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, destPath);
          } else {
            // 创建一个简单的占位符文件
            writeFileSync(destPath, `# Placeholder for ${size}x${size} icon`);
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 开发服务器配置（虽然 Chrome 扩展通常不需要）
  server: {
    port: 3000
  }
});
