import { describe, expect, it } from 'vitest';
import { ModbusError, ModbusErrorCode } from './errors.js';
import {
  decodeResponsePdu,
  encodeReadHoldingRequest,
  encodeWriteMultipleRequest,
  FC_READ_HOLDING,
  FC_WRITE_MULTIPLE,
} from './pdu.js';

describe('PDU read request (FC 0x03)', () => {
  it('encodes the manual example: addr 1010, count 6', () => {
    const pdu = encodeReadHoldingRequest(1010, 6);
    // bytes: 03 03 F2 00 06
    expect(pdu.toString('hex')).toBe('0303f20006');
  });

  it('rejects count above 125', () => {
    expect(() => encodeReadHoldingRequest(0, 126)).toThrow();
  });
});

describe('PDU write request (FC 0x10)', () => {
  it('encodes the manual example: set-time at addr 300, 7 regs', () => {
    const values = [1200, 2022, 7, 1, 12, 23, 25];
    const pdu = encodeWriteMultipleRequest(300, values);
    // FC=10 addr=012C count=0007 bc=0E payload=04B0 07E6 0007 0001 000C 0017 0019
    expect(pdu.toString('hex')).toBe('10012c00070e04b007e60007000100' + '0c00170019');
  });

  it('rejects more than 123 registers', () => {
    expect(() =>
      encodeWriteMultipleRequest(300, new Array(124).fill(0)),
    ).toThrow();
  });

  it('rejects out-of-range register value', () => {
    expect(() => encodeWriteMultipleRequest(300, [-1])).toThrow();
    expect(() => encodeWriteMultipleRequest(300, [0x10000])).toThrow();
  });
});

describe('PDU response decoding', () => {
  it('decodes the manual example: 3 Float32 = 220.0', () => {
    // response PDU (without MBAP): 03 0C 43 5C 00 00 43 5C 00 00 43 5C 00 00
    const pdu = Buffer.from('030c435c0000435c0000435c0000', 'hex');
    const decoded = decodeResponsePdu(pdu);
    expect(decoded.fc).toBe(FC_READ_HOLDING);
    if (decoded.fc !== FC_READ_HOLDING) throw new Error('unreachable');
    expect(decoded.registers).toEqual([0x435c, 0, 0x435c, 0, 0x435c, 0]);
  });

  it('decodes a write response: addr 300, count 7', () => {
    const pdu = Buffer.from('10012c0007', 'hex');
    const decoded = decodeResponsePdu(pdu);
    expect(decoded.fc).toBe(FC_WRITE_MULTIPLE);
    if (decoded.fc !== FC_WRITE_MULTIPLE) throw new Error('unreachable');
    expect(decoded.startAddress).toBe(300);
    expect(decoded.count).toBe(7);
  });

  it('throws on exception response', () => {
    // FC|0x80 = 0x83, code = 0x02 (illegal data address)
    const pdu = Buffer.from('8302', 'hex');
    try {
      decodeResponsePdu(pdu);
      throw new Error('expected error');
    } catch (e) {
      expect(e).toBeInstanceOf(ModbusError);
      const me = e as ModbusError;
      expect(me.fc).toBe(0x03);
      expect(me.code).toBe(ModbusErrorCode.IllegalDataAddress);
    }
  });
});
