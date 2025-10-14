// Vitest 测试环境设置
import { vi } from 'vitest';

const globalAny = globalThis as typeof globalThis & {
  chrome?: Record<string, unknown>;
  fetch?: typeof fetch;
  requestAnimationFrame?: typeof requestAnimationFrame;
  console?: Console;
};

// 模拟 Chrome Extension API
globalAny.chrome = {
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
} as unknown as typeof chrome;

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

if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-url'),
    writable: true
  });
} else {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock-url');
}

if (typeof URL.revokeObjectURL !== 'function') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true
  });
} else {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
}

// 模拟 fetch API
globalAny.fetch = vi.fn((url: RequestInfo | URL) => {
  if (typeof url === 'string' && url.includes('api.dictionaryapi.dev')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
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
    json: () =>
      Promise.resolve({
        data: {
          translations: [
            {
              translatedText: '测试翻译',
              detectedSourceLanguage: 'en'
            }
          ]
        }
      })
  });
}) as unknown as typeof fetch;

// 模拟 console 方法
globalAny.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

// 模拟 requestAnimationFrame
globalAny.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => window.setTimeout(cb, 0));

// 启用假定时器
vi.useFakeTimers();
