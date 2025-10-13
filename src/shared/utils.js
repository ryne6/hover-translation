import { CACHE_CONFIG } from './constants.js';

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 限制时间
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 生成缓存键
 * @param {string} text 文本
 * @param {string} sourceLang 源语言
 * @param {string} targetLang 目标语言
 * @returns {string} 缓存键
 */
export function generateCacheKey(text, sourceLang, targetLang) {
  return `${text}_${sourceLang}_${targetLang}`;
}

/**
 * 检查缓存是否过期
 * @param {number} timestamp 时间戳
 * @returns {boolean} 是否过期
 */
export function isCacheExpired(timestamp) {
  return Date.now() - timestamp > CACHE_CONFIG.TTL;
}

/**
 * 获取语言显示名称
 * @param {string} langCode 语言代码
 * @returns {string} 显示名称
 */
export function getLanguageName(langCode) {
  const languageNames = {
    'zh-CN': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'ru': 'Русский',
    'it': 'Italiano',
    'pt': 'Português',
    'ar': 'العربية',
    'hi': 'हिन्दी'
  };
  return languageNames[langCode] || (langCode ? langCode.toUpperCase() : 'AUTO');
}

/**
 * 检测文本语言
 * @param {string} text 文本
 * @returns {string} 检测到的语言代码
 */
export function detectLanguage(text) {
  // 处理无效输入
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return 'auto';
  }

  // 按优先级检测，日文假名优先于汉字（因为日文也包含汉字）
  const patterns = [
    { lang: 'ja', pattern: /[\u3040-\u309f\u30a0-\u30ff]/ },  // 日文假名
    { lang: 'ko', pattern: /[\uac00-\ud7af]/ },              // 韩文
    { lang: 'ar', pattern: /[\u0600-\u06ff]/ },              // 阿拉伯文
    { lang: 'ru', pattern: /[\u0400-\u04ff]/ },              // 俄文
    { lang: 'hi', pattern: /[\u0900-\u097f]/ },              // 印地文
    { lang: 'zh-CN', pattern: /[\u4e00-\u9fff]/ },           // 中文汉字
    { lang: 'en', pattern: /^[a-zA-Z\s.,!?;:'"()-]+$/ }     // 英文
  ];

  for (const { lang, pattern } of patterns) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  return 'auto';
}

/**
 * 计算最佳位置
 * @param {DOMRect} selectionRect 选中文本的位置
 * @param {DOMRect} boxRect 悬浮框的位置
 * @param {Object} viewport 视窗信息
 * @returns {Object} 最佳位置坐标
 */
export function calculateOptimalPosition(selectionRect, boxRect, viewport) {
  const margin = 16;
  let x = selectionRect.left;
  let y = selectionRect.bottom + 8;

  // 水平位置调整
  const maxX = viewport.width - boxRect.width - margin;
  if (x > maxX) {
    x = Math.max(margin, maxX);
  }
  if (x < margin) {
    x = margin;
  }

  // 垂直位置调整
  const fitsBelow = y + boxRect.height <= viewport.height - margin;
  if (!fitsBelow) {
    const aboveY = selectionRect.top - boxRect.height - 8;
    if (aboveY >= margin) {
      y = aboveY;
    } else {
      y = Math.max(margin, viewport.height - boxRect.height - margin);
    }
  }

  // 确保坐标为非负
  x = Math.max(margin, x);
  y = Math.max(margin, y);

  return { x, y };
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
}

/**
 * 显示通知
 * @param {string} message 通知消息
 * @param {string} type 通知类型
 */
export function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `hover-translation-notification ${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(notification);

  // 显示动画
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // 自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
