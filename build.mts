import { build as viteBuild } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, rmSync } from 'fs';

const rootDir = process.cwd();

async function buildEntry(name: string, inputPath: string): Promise<void> {
  console.log(`Building ${name}...`);

  await viteBuild({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: inputPath,
        name,
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

async function main(): Promise<void> {
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
  }
  mkdirSync('dist', { recursive: true });

  await buildEntry('content', resolve(rootDir, 'src/content/content.ts'));
  await buildEntry('background', resolve(rootDir, 'src/background/background.ts'));
  await buildEntry('popup', resolve(rootDir, 'src/popup/popup.ts'));
  await buildEntry('options', resolve(rootDir, 'src/options/options.ts'));

  console.log('Copying static files...');

  copyFileSync('src/manifest.json', 'dist/manifest.json');
  copyFileSync('src/popup/popup.html', 'dist/popup.html');
  copyFileSync('src/options/options.html', 'dist/options.html');

  if (!existsSync('dist/styles')) {
    mkdirSync('dist/styles', { recursive: true });
  }
  copyFileSync('src/styles/variables.css', 'dist/styles/variables.css');
  copyFileSync('src/styles/hover-box.css', 'dist/styles/hover-box.css');
  copyFileSync('src/styles/content.css', 'dist/styles/content.css');
  copyFileSync('src/popup/popup.css', 'dist/styles/popup.css');
  copyFileSync('src/options/options.css', 'dist/styles/options.css');

  if (!existsSync('dist/assets/icons')) {
    mkdirSync('dist/assets/icons', { recursive: true });
  }

  if (existsSync('assets/icons/icon.svg')) {
    copyFileSync('assets/icons/icon.svg', 'dist/assets/icons/icon.svg');
  }

  const iconSizes = [16, 32, 48, 128] as const;
  iconSizes.forEach((size) => {
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

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
