const { build } = require('vite');
const { resolve } = require('path');
const { copyFileSync, mkdirSync, existsSync, writeFileSync, rmSync } = require('fs');

async function buildEntry(name, inputPath) {
  console.log(`Building ${name}...`);
  
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: inputPath,
        name: name,
        formats: ['iife'],
        fileName: () => `${name}.js`
      },
      rollupOptions: {
        output: {
          extend: true,
          inlineDynamicImports: true
        }
      }
    }
  });
}

async function main() {
  // 清空 dist 目录
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true });
  }
  mkdirSync('dist', { recursive: true });

  // 构建每个入口文件
  await buildEntry('content', resolve(__dirname, 'src/content/content.js'));
  await buildEntry('background', resolve(__dirname, 'src/background/background.js'));
  await buildEntry('popup', resolve(__dirname, 'src/popup/popup.js'));
  await buildEntry('options', resolve(__dirname, 'src/options/options.js'));

  // 复制静态文件
  console.log('Copying static files...');
  
  // 复制 manifest.json
  copyFileSync('src/manifest.json', 'dist/manifest.json');
  
  // 复制 HTML 文件
  copyFileSync('src/popup/popup.html', 'dist/popup.html');
  copyFileSync('src/options/options.html', 'dist/options.html');
  
  // 复制样式文件
  if (!existsSync('dist/styles')) {
    mkdirSync('dist/styles', { recursive: true });
  }
  copyFileSync('src/styles/variables.css', 'dist/styles/variables.css');
  copyFileSync('src/styles/hover-box.css', 'dist/styles/hover-box.css');
  copyFileSync('src/styles/content.css', 'dist/styles/content.css');
  copyFileSync('src/popup/popup.css', 'dist/styles/popup.css');
  copyFileSync('src/options/options.css', 'dist/styles/options.css');
  
  // 复制资源文件
  if (!existsSync('dist/assets/icons')) {
    mkdirSync('dist/assets/icons', { recursive: true });
  }
  
  if (existsSync('assets/icons/icon.svg')) {
    copyFileSync('assets/icons/icon.svg', 'dist/assets/icons/icon.svg');
  }
  
  // 复制图标文件
  const iconSizes = [16, 32, 48, 128];
  iconSizes.forEach(size => {
    const sourcePath = `assets/icons/icon-${size}.png`;
    const destPath = `dist/assets/icons/icon-${size}.png`;
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, destPath);
    } else {
      writeFileSync(destPath, `# Placeholder for ${size}x${size} icon`);
    }
  });

  console.log('Build completed successfully!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
