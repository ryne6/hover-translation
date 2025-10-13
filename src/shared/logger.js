/**
 * 统一的日志系统
 * 提供格式化的日志输出，便于调试
 */
export class Logger {
  /**
   * 普通日志
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  static log(module, message, data) {
    const timestamp = new Date().toLocaleTimeString();
    if (data !== undefined) {
      console.log(`[${timestamp}] [${module}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${module}] ${message}`);
    }
  }

  /**
   * 成功日志
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  static success(module, message, data) {
    const timestamp = new Date().toLocaleTimeString();
    if (data !== undefined) {
      console.log(`[${timestamp}] [${module}] ✅ ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${module}] ✅ ${message}`);
    }
  }

  /**
   * 警告日志
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  static warn(module, message, data) {
    const timestamp = new Date().toLocaleTimeString();
    if (data !== undefined) {
      console.warn(`[${timestamp}] [${module}] ⚠️  ${message}`, data);
    } else {
      console.warn(`[${timestamp}] [${module}] ⚠️  ${message}`);
    }
  }

  /**
   * 错误日志
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   * @param {Error|*} error - 错误对象
   */
  static error(module, message, error) {
    const timestamp = new Date().toLocaleTimeString();
    if (error) {
      console.error(`[${timestamp}] [${module}] ❌ ${message}`, error);
    } else {
      console.error(`[${timestamp}] [${module}] ❌ ${message}`);
    }
  }

  /**
   * 调试日志（仅在开发模式下输出）
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   * @param {*} data - 附加数据
   */
  static debug(module, message, data) {
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      const timestamp = new Date().toLocaleTimeString();
      if (data !== undefined) {
        console.debug(`[${timestamp}] [${module}] 🔍 ${message}`, data);
      } else {
        console.debug(`[${timestamp}] [${module}] 🔍 ${message}`);
      }
    }
  }

  /**
   * 分组开始
   * @param {string} module - 模块名称
   * @param {string} message - 消息
   */
  static group(module, message) {
    console.group(`[${module}] ${message}`);
  }

  /**
   * 分组结束
   */
  static groupEnd() {
    console.groupEnd();
  }
}
