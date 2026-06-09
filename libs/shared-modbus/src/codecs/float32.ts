/**
 * IEEE 754 single precision codec.
 * Modbus convention used by MI-550: high word first (ABCD order).
 */

export function decodeFloat32(registers: ReadonlyArray<number>, offset = 0): number {
  if (registers.length - offset < 2) {
    throw new RangeError('Float32 needs 2 registers');
  }
  const hi = registers[offset] ?? 0;
  const lo = registers[offset + 1] ?? 0;
  const buf = Buffer.alloc(4);
  buf.writeUInt16BE(hi, 0);
  buf.writeUInt16BE(lo, 2);
  return buf.readFloatBE(0);
}

export function encodeFloat32(value: number): [number, number] {
  const buf = Buffer.alloc(4);
  buf.writeFloatBE(value, 0);
  return [buf.readUInt16BE(0), buf.readUInt16BE(2)];
}

/**
 * Decode an array of consecutive Float32 values from a register array.
 */
export function decodeFloat32Array(registers: ReadonlyArray<number>): number[] {
  if (registers.length % 2 !== 0) {
    throw new RangeError('register count must be even to decode Float32 array');
  }
  const out: number[] = new Array(registers.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = decodeFloat32(registers, i * 2);
  }
  return out;
}
