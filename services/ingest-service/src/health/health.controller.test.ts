import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const c = new HealthController();
  it('liveness', () => expect(c.liveness().status).toBe('ok'));
  it('readiness', () => expect(c.readiness().status).toBe('ready'));
});
