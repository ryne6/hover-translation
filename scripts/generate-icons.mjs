import { readFileSync } from 'fs';
import sharp from 'sharp';

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  console.log('🎨 开始生成图标...\n');

  // 读取 SVG 文件
  const svgBuffer = readFileSync('assets/icons/icon.svg');

  for (const size of sizes) {
    console.log(`📦 生成 ${size}x${size} 图标...`);
    
    // 使用 sharp 将 SVG 转换为 PNG
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`assets/icons/icon-${size}.png`);
    
    console.log(`✅ icon-${size}.png 已生成`);
  }

  console.log('\n🎉 所有图标生成完成！');
}

generateIcons().catch((err) => {
  console.error('❌ 生成图标失败:', err);
  process.exit(1);
});
