/**
 * Decode a string of UTF-8 bytes packed into consecutive Modbus registers.
 * Each register holds 2 bytes (big-endian, high byte first).
 * Null bytes terminate the string.
 */
export function decodeUtf8(
  registers: ReadonlyArray<number>,
  offset = 0,
  count = registers.length - offset,
): string {
  const bytes: number[] = [];
  for (let i = 0; i < count; i++) {
    const reg = registers[offset + i] ?? 0;
    const hi = (reg >> 8) & 0xff;
    const lo = reg & 0xff;
    if (hi === 0) break;
    bytes.push(hi);
    if (lo === 0) break;
    bytes.push(lo);
  }
  return Buffer.from(bytes).toString('utf8');
}

export function encodeUtf8(value: string, registerCount: number): number[] {
  const buf = Buffer.alloc(registerCount * 2, 0);
  buf.write(value, 0, registerCount * 2, 'utf8');
  const out: number[] = new Array(registerCount);
  for (let i = 0; i < registerCount; i++) {
    out[i] = buf.readUInt16BE(i * 2);
  }
  return out;
}
