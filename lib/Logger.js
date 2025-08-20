/**
 * 日志模块 - 提供分级日志记录功能
 */

// 日志级别定义
const LOG_LEVELS = {
  DEBUG: { value: 0, label: 'DEBUG', color: '\x1b[36m' }, // 青色
  INFO: { value: 1, label: 'INFO', color: '\x1b[32m' },  // 绿色
  WARN: { value: 2, label: 'WARN', color: '\x1b[33m' },  // 黄色
  ERROR: { value: 3, label: 'ERROR', color: '\x1b[31m' }, // 红色
  FATAL: { value: 4, label: 'FATAL', color: '\x1b[35m' }  // 紫色
};

// 重置颜色的ANSI转义序列
const RESET_COLOR = '\x1b[0m';

// 默认配置
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO.value, // 默认日志级别为INFO
  maxLogs: 100,                // 最大日志条数
  useColors: true,             // 控制台输出是否使用颜色
  logToConsole: true           // 是否同时输出到控制台
};

/**
 * 日志管理器类
 */
class Logger {
  /**
   * 创建日志管理器实例
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logs = [];
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  log(level, data, source = '') {
    // 检查日志级别是否应该被记录
    if (level.value < this.config.level) {
      return null;
    }

    // 创建日志对象
    const logEntry = {
      time: new Date().toLocaleString(),
      level: level.label,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
      source: source
    };

    // 添加到日志数组
    this.logs.unshift(logEntry);

    // 限制日志数量
    if (this.logs.length > this.config.maxLogs) {
      this.logs.pop();
    }

    // 输出到控制台
    if (this.config.logToConsole) {
      this._consoleOutput(level, logEntry);
    }

    return logEntry;
  }

  /**
   * 输出到控制台
   * @private
   * @param {Object} level - 日志级别对象
   * @param {Object} logEntry - 日志条目
   */
  _consoleOutput(level, logEntry) {
    const { time, data, source } = logEntry;
    const sourceInfo = source ? ` [${source}]` : '';
    
    if (this.config.useColors) {
      console.log(
        `${level.color}[${level.label}]${RESET_COLOR} [${time}]${sourceInfo}: ${data}`
      );
    } else {
      console.log(
        `[${level.label}] [${time}]${sourceInfo}: ${data}`
      );
    }
  }

  /**
   * 记录调试级别日志
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  debug(data, source) {
    return this.log(LOG_LEVELS.DEBUG, data, source);
  }

  /**
   * 记录信息级别日志
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  info(data, source) {
    return this.log(LOG_LEVELS.INFO, data, source);
  }

  /**
   * 记录警告级别日志
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  warn(data, source) {
    return this.log(LOG_LEVELS.WARN, data, source);
  }

  /**
   * 记录错误级别日志
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  error(data, source) {
    return this.log(LOG_LEVELS.ERROR, data, source);
  }

  /**
   * 记录致命错误级别日志
   * @param {any} data - 日志数据
   * @param {string} [source] - 日志来源
   * @returns {Object} 记录的日志对象
   */
  fatal(data, source) {
    return this.log(LOG_LEVELS.FATAL, data, source);
  }

  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 获取指定级别的日志
   * @param {string} level - 日志级别
   * @returns {Array} 过滤后的日志数组
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level.label);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * 设置日志级别
   * @param {Object} level - 日志级别对象
   */
  setLevel(level) {
    this.config.level = level.value;
  }

  /**
   * 设置最大日志条数
   * @param {number} maxLogs - 最大日志条数
   */
  setMaxLogs(maxLogs) {
    this.config.maxLogs = maxLogs;
    // 如果当前日志数量超过新设置的最大值，则裁剪
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(0, maxLogs);
    }
  }
}

// 创建一个全局日志实例
const globalLogger = new Logger();

// 导出模块
module.exports = {
  Logger,
  LOG_LEVELS,
  globalLogger,
  // 便捷方法
  debug: (data, source) => globalLogger.debug(data, source),
  info: (data, source) => globalLogger.info(data, source),
  warn: (data, source) => globalLogger.warn(data, source),
  error: (data, source) => globalLogger.error(data, source),
  fatal: (data, source) => globalLogger.fatal(data, source),
  getLogs: () => globalLogger.getLogs(),
  getLogsByLevel: (level) => globalLogger.getLogsByLevel(level),
  clearLogs: () => globalLogger.clearLogs(),
  setLevel: (level) => globalLogger.setLevel(level),
  setMaxLogs: (maxLogs) => globalLogger.setMaxLogs(maxLogs)
};