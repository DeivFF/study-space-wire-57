// Logger utility for conditional console logging
export const isDevelopment = import.meta.env.DEV;

interface LogMethods {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

class Logger implements LogMethods {
  private shouldLog: boolean;

  constructor() {
    this.shouldLog = isDevelopment;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog) {
      console.log('[APP]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog) {
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog) {
      console.warn('[WARN]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog) {
      console.debug('[DEBUG]', ...args);
    }
  }

  // Force production logging for critical errors
  forceError(...args: unknown[]): void {
    console.error('[CRITICAL]', ...args);
  }
}

export const logger = new Logger();

