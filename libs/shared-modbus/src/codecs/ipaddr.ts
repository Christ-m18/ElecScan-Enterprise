/**
 * IPv4 codec per manual section 8.
 * reg[0]: high byte = octet1, low byte = octet2
 * reg[1]: high byte = octet3, low byte = octet4
 */
export function decodeIPv4(registers: ReadonlyArray<number>, offset = 0): string {
  if (registers.length - offset < 2) throw new RangeError('IPv4 needs 2 registers');
  const r0 = registers[offset] ?? 0;
  const r1 = registers[offset + 1] ?? 0;
  const o1 = (r0 >> 8) & 0xff;
  const o2 = r0 & 0xff;
  const o3 = (r1 >> 8) & 0xff;
  const o4 = r1 & 0xff;
  return `${o1}.${o2}.${o3}.${o4}`;
}

export function encodeIPv4(ip: string): [number, number] {
  const parts = ip.split('.').map((s) => Number.parseInt(s, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    throw new RangeError(`invalid IPv4 address: ${ip}`);
  }
  const [a, b, c, d] = parts as [number, number, number, number];
  return [((a & 0xff) << 8) | (b & 0xff), ((c & 0xff) << 8) | (d & 0xff)];
}
