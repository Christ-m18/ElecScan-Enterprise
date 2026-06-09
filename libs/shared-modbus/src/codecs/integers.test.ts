import { describe, expect, it } from 'vitest';
import {
  decodeInt16,
  decodeInt32,
  decodeInt64,
  decodeUInt16,
  decodeUInt32,
  decodeUInt64,
  encodeUInt32,
} from './integers.js';

describe('Integer codecs', () => {
  it('decodes UInt16 plain', () => {
    expect(decodeUInt16([0x1234])).toBe(0x1234);
  });
  it('decodes Int16 signed boundary', () => {
    expect(decodeInt16([0x8000])).toBe(-32768);
    expect(decodeInt16([0xffff])).toBe(-1);
    expect(decodeInt16([0x7fff])).toBe(32767);
  });
  it('decodes UInt32 hi/lo', () => {
    expect(decodeUInt32([0x0001, 0x0000])).toBe(0x10000);
    expect(decodeUInt32([0xffff, 0xffff])).toBe(0xffffffff);
  });
  it('decodes Int32 sign', () => {
    expect(decodeInt32([0xffff, 0xffff])).toBe(-1);
    expect(decodeInt32([0x8000, 0x0000])).toBe(-2147483648);
  });
  it('encodes UInt32 round-trip', () => {
    const [hi, lo] = encodeUInt32(0x12345678);
    expect(hi).toBe(0x1234);
    expect(lo).toBe(0x5678);
    expect(decodeUInt32([hi, lo])).toBe(0x12345678);
  });
  it('UInt32 out-of-range throws', () => {
    expect(() => encodeUInt32(-1)).toThrow(/UInt32/);
    expect(() => encodeUInt32(2 ** 32)).toThrow(/UInt32/);
  });
  it('decodes UInt64 big', () => {
    expect(decodeUInt64([0x0000, 0x0000, 0x0000, 0x0001])).toBe(1n);
    expect(decodeUInt64([0xffff, 0xffff, 0xffff, 0xffff])).toBe(0xffffffffffffffffn);
  });
  it('decodes Int64 signed', () => {
    expect(decodeInt64([0xffff, 0xffff, 0xffff, 0xffff])).toBe(-1n);
    expect(decodeInt64([0x8000, 0x0000, 0x0000, 0x0000])).toBe(-(2n ** 63n));
  });
});
