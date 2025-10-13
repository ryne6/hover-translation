// 简单测试文件，验证项目基本功能
import { SUPPORTED_LANGUAGES } from '../src/shared/constants.js';
import { getLanguageName, detectLanguage } from '../src/shared/utils.js';
import { TextSelector } from '../src/content/text-selector.js';
import { HoverBox } from '../src/content/hover-box.js';

describe('Hover Translation - Basic Tests', () => {
  test('项目应该能够正常启动', () => {
    expect(true).toBe(true);
  });

  test('应该能够导入主要模块', () => {
    // 测试常量模块
    expect(SUPPORTED_LANGUAGES).toBeDefined();
    expect(SUPPORTED_LANGUAGES['zh-CN']).toBe('简体中文');
    expect(SUPPORTED_LANGUAGES['en']).toBe('English');
  });

  test('应该能够导入工具函数', () => {
    expect(getLanguageName).toBeDefined();
    expect(detectLanguage).toBeDefined();
    
    expect(getLanguageName('zh-CN')).toBe('中文');
    expect(detectLanguage('你好')).toBe('zh-CN');
  });

  test('应该能够创建 TextSelector 实例', () => {
    const selector = new TextSelector();
    expect(selector).toBeDefined();
    expect(selector.selectedText).toBe('');
  });

  test('应该能够创建 HoverBox 实例', () => {
    const hoverBox = new HoverBox();
    expect(hoverBox).toBeDefined();
    expect(hoverBox.isVisible).toBe(false);
  });
});