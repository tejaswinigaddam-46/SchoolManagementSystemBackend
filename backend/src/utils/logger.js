/**
 * Logger Utility
 * Centralized logging for the application
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || LogLevel.INFO;
    this.enableColors = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    }

    // Development format
    const color = this.getColorForLevel(level);
    const coloredLevel = this.enableColors ? `${color}${level.toUpperCase()}${colors.reset}` : level.toUpperCase();
    
    let formatted = `[${timestamp}] ${coloredLevel}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formatted += ` ${JSON.stringify(meta)}`;
    }
    
    return formatted;
  }

  /**
   * Get color for log level
   */
  getColorForLevel(level) {
    switch (level.toLowerCase()) {
      case 'error': return colors.red;
      case 'warn': return colors.yellow;
      case 'info': return colors.green;
      case 'debug': return colors.cyan;
      default: return colors.white;
    }
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Log API request
   */
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: req.tenantId,
      userId: req.userId
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.url} - ${res.statusCode}`;
    
    this[level](message, meta);
  }

  /**
   * Log database operation
   */
  logDatabase(operation, table, duration, meta = {}) {
    this.debug(`DB ${operation.toUpperCase()} ${table}`, {
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event, userId, tenantId, meta = {}) {
    this.info(`Auth ${event}`, {
      event,
      userId,
      tenantId,
      ...meta
    });
  }

  /**
   * Log security event
   */
  logSecurity(event, details, meta = {}) {
    this.warn(`Security ${event}`, {
      event,
      details,
      ...meta
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
