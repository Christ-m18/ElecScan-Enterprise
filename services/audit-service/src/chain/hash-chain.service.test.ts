import { describe, expect, it } from 'vitest';
import { HashChainService } from './hash-chain.service.js';

describe('HashChainService', () => {
  const svc = new HashChainService();

  it('produces same hash for canonical equivalent payloads', () => {
    const a = svc.hashPayload({ b: 2, a: 1 });
    const b = svc.hashPayload({ a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it('verifies a valid chain link', () => {
    const h1 = svc.hashPayload({ action: 'login' });
    const link = svc.chain(null, h1);
    expect(svc.verify(null, h1, link)).toBe(true);
  });

  it('fails verification on tampered hash', () => {
    const h1 = svc.hashPayload({ action: 'login' });
    const link = svc.chain(null, h1);
    expect(svc.verify(null, h1.replace(/.$/, 'f'), link)).toBe(false);
  });
});
