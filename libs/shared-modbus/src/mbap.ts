import { ModbusFramingError } from './errors.js';
import type { MbapHeader } from './types.js';

export const MBAP_HEADER_LENGTH = 7;
export const PROTOCOL_ID_MODBUS = 0x0000;

/**
 * Encode an MBAP header.
 * Manual section 6.1.
 *
 * @param transactionId  client-assigned correlation id (uint16)
 * @param unitId         slave id (uint8). Default 1 for MI-550.
 * @param pduLength      length in bytes of [unitId + PDU]. Caller must compute this.
 */
export function encodeMbap(
  transactionId: number,
  unitId: number,
  pduLength: number,
): Buffer {
  if (transactionId < 0 || transactionId > 0xffff) {
    throw new RangeError(`transactionId out of uint16 range: ${transactionId}`);
  }
  if (unitId < 0 || unitId > 0xff) {
    throw new RangeError(`unitId out of uint8 range: ${unitId}`);
  }
  if (pduLength < 1 || pduLength > 0xffff) {
    throw new RangeError(`pduLength out of range: ${pduLength}`);
  }
  const buf = Buffer.alloc(MBAP_HEADER_LENGTH);
  buf.writeUInt16BE(transactionId, 0);
  buf.writeUInt16BE(PROTOCOL_ID_MODBUS, 2);
  // length field counts unitId + PDU bytes; pduLength is the number of bytes
  // following the length field, including the unit id.
  buf.writeUInt16BE(pduLength, 4);
  buf.writeUInt8(unitId, 6);
  return buf;
}

/**
 * Decode an MBAP header from the leading 7 bytes of a frame.
 * Validates protocol id and that the buffer holds the full frame.
 */
export function decodeMbap(buf: Buffer): MbapHeader {
  if (buf.length < MBAP_HEADER_LENGTH) {
    throw new ModbusFramingError(
      `buffer too short for MBAP header: have ${buf.length}, need ${MBAP_HEADER_LENGTH}`,
    );
  }
  const transactionId = buf.readUInt16BE(0);
  const protocolId = buf.readUInt16BE(2);
  if (protocolId !== PROTOCOL_ID_MODBUS) {
    throw new ModbusFramingError(`unexpected protocol id 0x${protocolId.toString(16)}`);
  }
  const length = buf.readUInt16BE(4);
  const unitId = buf.readUInt8(6);
  return { transactionId, protocolId, length, unitId };
}

/**
 * Given a buffer pointing at the start of one or more MBAP frames, return the
 * total length of the first frame (header + payload). Returns null if not yet
 * complete.
 */
export function firstFrameLength(buf: Buffer): number | null {
  if (buf.length < MBAP_HEADER_LENGTH) return null;
  const length = buf.readUInt16BE(4);
  // total = 6 (transactionId+protocolId+length fields) + length bytes
  const total = 6 + length;
  if (buf.length < total) return null;
  return total;
}
