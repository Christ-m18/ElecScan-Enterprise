import { describe, expect, it } from 'vitest';
import { decodeUtf8, encodeUtf8 } from './utf8.js';

describe('UTF8 codec', () => {
  it('round-trips a short ASCII string', () => {
    const regs = encodeUtf8('Mi550', 5);
    expect(decodeUtf8(regs, 0, 5)).toBe('Mi550');
  });

  it('terminates on null byte', () => {
    const regs = encodeUtf8('AB', 5);
    expect(decodeUtf8(regs, 0, 5)).toBe('AB');
  });

  it('handles unicode within register width', () => {
    const regs = encodeUtf8('Hola', 4);
    expect(decodeUtf8(regs, 0, 4)).toBe('Hola');
  });
});
