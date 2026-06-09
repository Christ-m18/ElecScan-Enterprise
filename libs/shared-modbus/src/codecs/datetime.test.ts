import { describe, expect, it } from 'vitest';
import { decodeDateTimeFields, decodeDateTimeToDate, encodeDateTime } from './datetime.js';

describe('DateTime codec', () => {
  it('round-trips a known timestamp', () => {
    const dt = new Date(Date.UTC(2026, 5, 7, 12, 34, 56, 789));
    const regs = encodeDateTime(dt);
    const back = decodeDateTimeToDate(regs);
    expect(back.toISOString()).toBe(dt.toISOString());
  });

  it('decodes raw fields from registers', () => {
    const regs = encodeDateTime({
      year: 2022,
      month: 7,
      day: 1,
      hour: 12,
      minute: 23,
      second: 25,
      millisecond: 0,
    });
    const f = decodeDateTimeFields(regs);
    expect(f.year).toBe(2022);
    expect(f.month).toBe(7);
    expect(f.day).toBe(1);
    expect(f.hour).toBe(12);
    expect(f.minute).toBe(23);
    expect(f.second).toBe(25);
    expect(f.millisecond).toBe(0);
  });

  it('rejects invalid fields', () => {
    expect(() =>
      encodeDateTime({
        year: 1999,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      }),
    ).toThrow(/year/);
    expect(() =>
      encodeDateTime({
        year: 2026,
        month: 13,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      }),
    ).toThrow(/month/);
  });

  it('needs 4 registers to decode', () => {
    expect(() => decodeDateTimeFields([1, 2, 3])).toThrow(/4 registers/);
  });
});
