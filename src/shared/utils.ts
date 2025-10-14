import { CACHE_CONFIG, SUPPORTED_LANGUAGES, SupportedLanguageCode } from './constants';

type AnyFunction = (...args: unknown[]) => void;

export function debounce<T extends AnyFunction>(func: T, wait: number): (...funcArgs: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    const later = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends AnyFunction>(func: T, limit: number): (...funcArgs: Parameters<T>) => void {
  let inThrottle = false;
  return function throttled(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function generateCacheKey(text: string, sourceLang: string, targetLang: string): string {
  return `${text}_${sourceLang}_${targetLang}`;
}

export function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_CONFIG.TTL;
}

export function getLanguageName(langCode?: string | null): string {
  if (!langCode) {
    return 'AUTO';
  }
  return SUPPORTED_LANGUAGES[langCode as SupportedLanguageCode] ?? langCode.toUpperCase();
}

export type DetectedLanguage = SupportedLanguageCode | 'auto';

export function detectLanguage(text: string | null | undefined): DetectedLanguage {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return 'auto';
  }

  const trimmed = text.trim();
  const patterns: Array<{ lang: DetectedLanguage; pattern: RegExp }> = [
    { lang: 'ja', pattern: /[\u3040-\u309f\u30a0-\u30ff]/ },
    { lang: 'ko', pattern: /[\uac00-\ud7af]/ },
    { lang: 'ar', pattern: /[\u0600-\u06ff]/ },
    { lang: 'ru', pattern: /[\u0400-\u04ff]/ },
    { lang: 'hi', pattern: /[\u0900-\u097f]/ },
    { lang: 'zh-CN', pattern: /[\u4e00-\u9fff]/ },
    { lang: 'en', pattern: /^[a-zA-Z\s.,!?;:'"()-]+$/ }
  ];

  for (const { lang, pattern } of patterns) {
    if (pattern.test(trimmed)) {
      return lang;
    }
  }

  return 'auto';
}

export interface ViewportRect {
  width: number;
  height: number;
}

export interface OptimalPosition {
  x: number;
  y: number;
}

export function calculateOptimalPosition(selectionRect: DOMRect, boxRect: DOMRect, viewport: ViewportRect): OptimalPosition {
  const margin = 16;
  let x = selectionRect.left;
  let y = selectionRect.bottom + 8;

  const maxX = viewport.width - boxRect.width - margin;
  if (x > maxX) {
    x = Math.max(margin, maxX);
  }
  if (x < margin) {
    x = margin;
  }

  const fitsBelow = y + boxRect.height <= viewport.height - margin;
  if (!fitsBelow) {
    const aboveY = selectionRect.top - boxRect.height - 8;
    if (aboveY >= margin) {
      y = aboveY;
    } else {
      y = Math.max(margin, viewport.height - boxRect.height - margin);
    }
  }

  return {
    x: Math.max(margin, x),
    y: Math.max(margin, y)
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export function showNotification(message: string, type: NotificationType = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `hover-translation-notification ${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

export function sendRuntimeMessage<Request extends Record<string, unknown>, Response = unknown>(
  message: Request
): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Chrome runtime API 不可用'));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        const lastError = chrome.runtime?.lastError;
        if (lastError) {
          reject(lastError);
          return;
        }
        resolve(response as Response);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
