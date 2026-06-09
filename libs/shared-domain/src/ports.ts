/**
 * Common port interfaces shared across services.
 * Implementations live under each service infrastructure/ folder.
 */

export interface Clock {
  now(): Date;
  nowIso(): string;
}

export interface IdGenerator {
  newUuid(): string;
}

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

export interface EventPublisher {
  publish<T>(subject: string, payload: T, headers?: Record<string, string>): Promise<void>;
}
