import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConfigError, loadEnv } from './env.js';

describe('loadEnv', () => {
  const schema = z.object({
    NODE_ENV: z.enum(['development', 'production']),
    PORT: z.string().transform((s) => Number.parseInt(s, 10)),
  });

  it('returns typed values when valid', () => {
    const cfg = loadEnv(schema, { NODE_ENV: 'production', PORT: '4000' } as NodeJS.ProcessEnv);
    expect(cfg.PORT).toBe(4000);
    expect(cfg.NODE_ENV).toBe('production');
  });

  it('throws ConfigError listing issues when invalid', () => {
    expect(() => loadEnv(schema, { NODE_ENV: 'staging' } as NodeJS.ProcessEnv)).toThrow(
      ConfigError,
    );
  });
});
