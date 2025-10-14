type LogData = unknown;

function formatPrefix(module: string, symbol = ''): string {
  const timestamp = new Date().toLocaleTimeString();
  return `[${timestamp}] [${module}] ${symbol}`.trim();
}

const isDevelopment = () =>
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
  (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost');

export class Logger {
  static log(module: string, message: string, data?: LogData): void {
    const prefix = formatPrefix(module);
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static success(module: string, message: string, data?: LogData): void {
    const prefix = formatPrefix(module, '✅');
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static warn(module: string, message: string, data?: LogData): void {
    const prefix = formatPrefix(module, '⚠️');
    if (data !== undefined) {
      console.warn(`${prefix}  ${message}`, data);
    } else {
      console.warn(`${prefix}  ${message}`);
    }
  }

  static error(module: string, message: string, error?: unknown): void {
    const prefix = formatPrefix(module, '❌');
    if (error !== undefined) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  static debug(module: string, message: string, data?: LogData): void {
    if (!isDevelopment()) return;
    const prefix = formatPrefix(module, '🔍');
    if (data !== undefined) {
      console.debug(`${prefix} ${message}`, data);
    } else {
      console.debug(`${prefix} ${message}`);
    }
  }

  static group(module: string, message: string): void {
    console.group(`[${module}] ${message}`);
  }

  static groupEnd(): void {
    console.groupEnd();
  }
}
