import { ModbusError, type ModbusErrorCode, ModbusFramingError } from './errors.js';
import type { ModbusReadResponse, ModbusWriteResponse } from './types.js';

export const FC_READ_HOLDING = 0x03;
export const FC_WRITE_MULTIPLE = 0x10;

/**
 * Build the PDU for a read-holding-registers request (FC 0x03).
 *
 * @param startAddress decimal register address as documented in the catalog.
 * @param count        number of 16-bit registers, 1..125 per spec.
 */
export function encodeReadHoldingRequest(startAddress: number, count: number): Buffer {
  if (startAddress < 0 || startAddress > 0xffff) {
    throw new RangeError(`startAddress out of uint16 range: ${startAddress}`);
  }
  if (count < 1 || count > 125) {
    throw new RangeError(`count out of 1..125 range: ${count}`);
  }
  const buf = Buffer.alloc(5);
  buf.writeUInt8(FC_READ_HOLDING, 0);
  buf.writeUInt16BE(startAddress, 1);
  buf.writeUInt16BE(count, 3);
  return buf;
}

/**
 * Build the PDU for a write-multiple-registers request (FC 0x10).
 * Manual restricts the writable range to 300..423 (instruction register block).
 */
export function encodeWriteMultipleRequest(
  startAddress: number,
  values: ReadonlyArray<number>,
): Buffer {
  if (startAddress < 0 || startAddress > 0xffff) {
    throw new RangeError(`startAddress out of uint16 range: ${startAddress}`);
  }
  if (values.length < 1 || values.length > 123) {
    throw new RangeError(`values.length out of 1..123 range: ${values.length}`);
  }
  const byteCount = values.length * 2;
  const buf = Buffer.alloc(6 + byteCount);
  buf.writeUInt8(FC_WRITE_MULTIPLE, 0);
  buf.writeUInt16BE(startAddress, 1);
  buf.writeUInt16BE(values.length, 3);
  buf.writeUInt8(byteCount, 5);
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    if (v < 0 || v > 0xffff) {
      throw new RangeError(`register value at index ${i} out of uint16 range: ${v}`);
    }
    buf.writeUInt16BE(v, 6 + i * 2);
  }
  return buf;
}

/**
 * Parse the PDU of a response. Detects exception responses (high bit set in FC).
 */
export function decodeResponsePdu(pdu: Buffer): ModbusReadResponse | ModbusWriteResponse {
  if (pdu.length < 2) {
    throw new ModbusFramingError(`response PDU too short: ${pdu.length}`);
  }
  const fc = pdu.readUInt8(0);

  if ((fc & 0x80) !== 0) {
    const originalFc = fc & 0x7f;
    const code = pdu.readUInt8(1) as ModbusErrorCode;
    throw new ModbusError(originalFc, code);
  }

  switch (fc) {
    case FC_READ_HOLDING: {
      const byteCount = pdu.readUInt8(1);
      if (pdu.length < 2 + byteCount) {
        throw new ModbusFramingError(
          `read response truncated: have ${pdu.length}, need ${2 + byteCount}`,
        );
      }
      if (byteCount % 2 !== 0) {
        throw new ModbusFramingError(`read response byte count odd: ${byteCount}`);
      }
      const registers: number[] = new Array(byteCount / 2);
      for (let i = 0; i < registers.length; i++) {
        registers[i] = pdu.readUInt16BE(2 + i * 2);
      }
      return { fc: FC_READ_HOLDING, registers };
    }
    case FC_WRITE_MULTIPLE: {
      if (pdu.length < 5) {
        throw new ModbusFramingError(`write response truncated: ${pdu.length}`);
      }
      const startAddress = pdu.readUInt16BE(1);
      const count = pdu.readUInt16BE(3);
      return { fc: FC_WRITE_MULTIPLE, startAddress, count };
    }
    default:
      throw new ModbusFramingError(`unsupported FC in response: 0x${fc.toString(16)}`);
  }
}
