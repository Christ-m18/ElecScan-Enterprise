import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const ctrl = new HealthController();
  it('liveness returns ok', () => {
    expect(ctrl.liveness()).toEqual({ status: 'ok', service: 'api-gateway' });
  });
  it('readiness returns ready', () => {
    expect(ctrl.readiness()).toEqual({ status: 'ready', service: 'api-gateway' });
  });
});
