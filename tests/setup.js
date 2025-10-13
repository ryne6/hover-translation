// Vitest 测试环境设置
import { vi } from 'vitest';

// 模拟 Chrome Extension API
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onInstalled: {
      addListener: vi.fn()
    }
  }
};

// 模拟 DOM 环境
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => ({
    toString: () => '',
    getRangeAt: vi.fn(() => ({
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 20,
        width: 100,
        height: 20
      })
    })),
    rangeCount: 0
  }))
});

Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve())
    }
  }
});

if (!global.URL) {
  global.URL = {};
}

URL.createObjectURL = vi.fn(() => 'blob:mock-url');
URL.revokeObjectURL = vi.fn();

// 模拟 fetch API
global.fetch = vi.fn((url) => {
  if (typeof url === 'string' && url.includes('api.dictionaryapi.dev')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          phonetic: '/həˈləʊ/',
          phonetics: [
            { text: '/həˈləʊ/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3' },
            { text: '/həˈloʊ/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-us.mp3' }
          ]
        }
      ])
    });
  }

  if (typeof url === 'string' && url.endsWith('.mp3')) {
    return Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'audio/mpeg' }))
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: {
        translations: [{
          translatedText: '测试翻译',
          detectedSourceLanguage: 'en'
        }]
      }
    })
  });
});

// 模拟 console 方法
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

// 模拟 requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));

// 模拟 setTimeout 和 clearTimeout
vi.useFakeTimers();
