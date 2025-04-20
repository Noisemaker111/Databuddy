import { Logtail } from "@logtail/edge";

// Create a logger instance with Better Stack
export const logger = new Logtail("cEe8CU2VwLfsESg52QLAwPvp", {
    endpoint: 'https://s1222612.eu-nbg-2.betterstackdata.com',
    // Add additional Better Stack configuration
    batchSize: 10, // Send logs in batches of 10
    batchInterval: 1000, // Or when 1 second passes
});

export const createLogger = (name: string) => {
  return {
    info: (message: string, ...args: any[]) => logger.info(`${message} from ${name}`, ...args),
    error: (message: string, ...args: any[]) => logger.error(`${message} from ${name}`, ...args),
    debug: (message: string, ...args: any[]) => logger.debug(`${message} from ${name}`, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(`${message} from ${name}`, ...args),
    log: (level: LogLevel, message: string, ...args: any[]) => logger[level](`${message} from ${name}`, ...args),
  }
}

// Log levels to ensure we only log important events
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}
