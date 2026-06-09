/**
 * Integer codecs for Modbus. All values stored big-endian, high register first.
 */

export function decodeUInt16(registers: ReadonlyArray<number>, offset = 0): number {
  const v = registers[offset];
  if (v === undefined) throw new RangeError('UInt16 needs 1 register');
  return v & 0xffff;
}

export function decodeInt16(registers: ReadonlyArray<number>, offset = 0): number {
  const u = decodeUInt16(registers, offset);
  return u >= 0x8000 ? u - 0x10000 : u;
}

export function decodeUInt32(registers: ReadonlyArray<number>, offset = 0): number {
  if (registers.length - offset < 2) throw new RangeError('UInt32 needs 2 registers');
  const hi = registers[offset] ?? 0;
  const lo = registers[offset + 1] ?? 0;
  return hi * 0x10000 + lo;
}

export function decodeInt32(registers: ReadonlyArray<number>, offset = 0): number {
  const u = decodeUInt32(registers, offset);
  return u >= 0x80000000 ? u - 0x100000000 : u;
}

export function encodeUInt32(value: number): [number, number] {
  if (value < 0 || value > 0xffffffff) {
    throw new RangeError(`UInt32 out of range: ${value}`);
  }
  const hi = Math.floor(value / 0x10000) & 0xffff;
  const lo = value & 0xffff;
  return [hi, lo];
}

/**
 * 64-bit integer using BigInt. Modbus stores high word first across 4 registers.
 */
export function decodeUInt64(registers: ReadonlyArray<number>, offset = 0): bigint {
  if (registers.length - offset < 4) throw new RangeError('UInt64 needs 4 registers');
  const r0 = BigInt(registers[offset] ?? 0);
  const r1 = BigInt(registers[offset + 1] ?? 0);
  const r2 = BigInt(registers[offset + 2] ?? 0);
  const r3 = BigInt(registers[offset + 3] ?? 0);
  return (r0 << 48n) | (r1 << 32n) | (r2 << 16n) | r3;
}

export function decodeInt64(registers: ReadonlyArray<number>, offset = 0): bigint {
  const u = decodeUInt64(registers, offset);
  const signBit = 1n << 63n;
  return (u & signBit) !== 0n ? u - (1n << 64n) : u;
}
