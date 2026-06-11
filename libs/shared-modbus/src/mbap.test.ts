import { describe, expect, it } from 'vitest';
import { ModbusFramingError } from './errors.js';
import { MBAP_HEADER_LENGTH, decodeMbap, encodeMbap, firstFrameLength } from './mbap.js';

describe('MBAP header', () => {
  it('encodes the manual example request header', () => {
    // Manual section 6.2.1: read UA, UB, UC at addr 1010 (0x03F2), count 6
    // request bytes: 00 00 00 00 00 06 01 03 03 F2 00 06
    // header = first 7 bytes
    const buf = encodeMbap(0x0000, 0x01, 6);
    expect(buf.toString('hex')).toBe('000000000006' + '01');
    expect(buf.length).toBe(MBAP_HEADER_LENGTH);
  });

  it('decodes a header', () => {
    const buf = encodeMbap(0x1234, 0x05, 12);
    const hdr = decodeMbap(buf);
    expect(hdr.transactionId).toBe(0x1234);
    expect(hdr.protocolId).toBe(0);
    expect(hdr.length).toBe(12);
    expect(hdr.unitId).toBe(0x05);
  });

  it('rejects bad protocol id', () => {
    const bad = Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x01]);
    expect(() => decodeMbap(bad)).toThrow(ModbusFramingError);
  });

  it('detects incomplete frames', () => {
    const partial = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(firstFrameLength(partial)).toBeNull();
  });

  it('returns total length when complete', () => {
    // header says length=6, so total = 6 + 6 = 12
    const buf = Buffer.concat([encodeMbap(0, 1, 6), Buffer.from([0x03, 0x04, 0x00, 0x00, 0x00])]);
    expect(firstFrameLength(buf)).toBe(12);
  });

  it('rejects out-of-range header fields', () => {
    expect(() => encodeMbap(-1, 1, 1)).toThrow();
    expect(() => encodeMbap(0, 256, 1)).toThrow();
    expect(() => encodeMbap(0, 1, 0)).toThrow();
  });
});
