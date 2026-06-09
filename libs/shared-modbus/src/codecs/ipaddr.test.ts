import { describe, expect, it } from 'vitest';
import { decodeIPv4, encodeIPv4 } from './ipaddr.js';

describe('IPv4 codec', () => {
  it('decodes the MI-550 example 192.168.1.55', () => {
    // Manual example for 192.168.1.5 uses registers (192<<8|168, 1<<8|5).
    const regs = encodeIPv4('192.168.1.55');
    expect(decodeIPv4(regs)).toBe('192.168.1.55');
  });

  it('rejects invalid addresses', () => {
    expect(() => encodeIPv4('256.0.0.0')).toThrow();
    expect(() => encodeIPv4('1.2.3')).toThrow();
    expect(() => encodeIPv4('a.b.c.d')).toThrow();
  });
});
