import { z } from 'zod';

const stringToInt = z
  .string()
  .transform((s) => Number.parseInt(s, 10))
  .pipe(z.number().int().nonnegative());

export const NodeEnvSchema = z.enum(['development', 'test', 'production']);

export const CommonEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  SERVICE_NAME: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAMESPACE: z.string().default('elecscan'),
});

export const HttpEnvSchema = z.object({
  PORT: stringToInt,
  HOST: z.string().default('0.0.0.0'),
});

export const PostgresEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const RedisEnvSchema = z.object({
  REDIS_URL: z.string().min(1),
});

export const NatsEnvSchema = z.object({
  NATS_URL: z.string().min(1),
});

export const JwtEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
});
