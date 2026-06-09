import { describe, expect, it } from 'vitest';
import { decodeFloat32, decodeFloat32Array, encodeFloat32 } from './float32.js';

describe('Float32 codec', () => {
  it('decodes 220.0 V as documented in MI-550 manual section 6.2.1', () => {
    // Manual example: register bytes 43 5C 00 00 = 220.0
    const registers = [0x435c, 0x0000];
    expect(decodeFloat32(registers)).toBeCloseTo(220.0, 5);
  });

  it('round-trips arbitrary values', () => {
    const values = [0, 1, -1, 0.0001, -12345.678, 1.5e20, -1.5e-20];
    for (const v of values) {
      const regs = encodeFloat32(v);
      expect(decodeFloat32(regs)).toBeCloseTo(v, 3);
    }
  });

  it('decodes arrays of float32', () => {
    const r = [0x435c, 0x0000, 0x435c, 0x0000, 0x435c, 0x0000];
    expect(decodeFloat32Array(r)).toEqual([220.0, 220.0, 220.0]);
  });

  it('throws on odd-length array', () => {
    expect(() => decodeFloat32Array([1, 2, 3])).toThrow(/even/);
  });

  it('throws on insufficient registers', () => {
    expect(() => decodeFloat32([1])).toThrow(/2 registers/);
  });
});
