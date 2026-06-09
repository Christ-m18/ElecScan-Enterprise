/**
 * DateTime codec for MI-550. Layout per manual section 8.
 *
 *  reg[0]: Year (2000..2099)                        - low 16 bits
 *  reg[1]: high byte = Month (1..12), low byte = Day (1..31)
 *  reg[2]: high byte = Hour (0..23), low byte = Minute (0..59)
 *  reg[3]: Millisecond (0..59999)
 *
 * Note: the manual encodes Second+Millisecond combined in reg[3] (0..59999).
 * We split second = floor(reg[3]/1000) and millis = reg[3] % 1000.
 */

export interface ModbusDateTimeFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export function decodeDateTimeFields(
  registers: ReadonlyArray<number>,
  offset = 0,
): ModbusDateTimeFields {
  if (registers.length - offset < 4) throw new RangeError('DateTime needs 4 registers');
  const year = registers[offset] ?? 0;
  const r1 = registers[offset + 1] ?? 0;
  const r2 = registers[offset + 2] ?? 0;
  const r3 = registers[offset + 3] ?? 0;
  const month = (r1 >> 8) & 0xff;
  const day = r1 & 0xff;
  const hour = (r2 >> 8) & 0xff;
  const minute = r2 & 0xff;
  const second = Math.floor(r3 / 1000) % 60;
  const millisecond = r3 % 1000;
  return { year, month, day, hour, minute, second, millisecond };
}

export function decodeDateTimeToDate(registers: ReadonlyArray<number>, offset = 0): Date {
  const f = decodeDateTimeFields(registers, offset);
  return new Date(Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second, f.millisecond));
}

/**
 * Encode a Date or fields into 4 registers, ready for the instruction
 * register write (command 1200).
 */
export function encodeDateTime(input: Date | ModbusDateTimeFields): [number, number, number, number] {
  const f = input instanceof Date
    ? {
        year: input.getUTCFullYear(),
        month: input.getUTCMonth() + 1,
        day: input.getUTCDate(),
        hour: input.getUTCHours(),
        minute: input.getUTCMinutes(),
        second: input.getUTCSeconds(),
        millisecond: input.getUTCMilliseconds(),
      }
    : input;
  if (f.year < 2000 || f.year > 2099) throw new RangeError(`year out of range: ${f.year}`);
  if (f.month < 1 || f.month > 12) throw new RangeError(`month out of range: ${f.month}`);
  if (f.day < 1 || f.day > 31) throw new RangeError(`day out of range: ${f.day}`);
  if (f.hour < 0 || f.hour > 23) throw new RangeError(`hour out of range: ${f.hour}`);
  if (f.minute < 0 || f.minute > 59) throw new RangeError(`minute out of range: ${f.minute}`);
  if (f.second < 0 || f.second > 59) throw new RangeError(`second out of range: ${f.second}`);
  if (f.millisecond < 0 || f.millisecond > 999) {
    throw new RangeError(`millisecond out of range: ${f.millisecond}`);
  }
  const r0 = f.year & 0xffff;
  const r1 = ((f.month & 0xff) << 8) | (f.day & 0xff);
  const r2 = ((f.hour & 0xff) << 8) | (f.minute & 0xff);
  const r3 = (f.second * 1000 + f.millisecond) & 0xffff;
  return [r0, r1, r2, r3];
}
