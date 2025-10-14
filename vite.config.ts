import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(process.cwd(), 'src/content/content.ts'),
        background: resolve(process.cwd(), 'src/background/background.ts'),
        popup: resolve(process.cwd(), 'src/popup/popup.ts'),
        options: resolve(process.cwd(), 'src/options/options.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true
      },
      preserveEntrySignatures: false
    }
  },
  plugins: [
    {
      name: 'copy-chrome-extension-files',
      writeBundle() {
        copyFileSync('src/manifest.json', 'dist/manifest.json');
        copyFileSync('src/popup/popup.html', 'dist/popup.html');

        if (!existsSync('dist/styles')) {
          mkdirSync('dist/styles', { recursive: true });
        }
        copyFileSync('src/styles/variables.css', 'dist/styles/variables.css');
        copyFileSync('src/styles/hover-box.css', 'dist/styles/hover-box.css');
        copyFileSync('src/styles/content.css', 'dist/styles/content.css');
        copyFileSync('src/popup/popup.css', 'dist/styles/popup.css');

        if (!existsSync('dist/assets')) {
          mkdirSync('dist/assets', { recursive: true });
        }
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
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src')
    }
  },
  server: {
    port: 3000
  }
});
