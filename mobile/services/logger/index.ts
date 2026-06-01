// Define safe logging levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Determine if environment is production
const IS_PROD = process.env.NODE_ENV === 'production';

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextString = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${contextString}`;
  }

  // Safe debugging: logs only if NOT in production
  debug(message: string, context?: Record<string, any>): void {
    if (!IS_PROD) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (!IS_PROD) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const extendedContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: error?.stack,
    };
    console.error(this.formatMessage('error', message, extendedContext));
  }
}

export const logger = new Logger();