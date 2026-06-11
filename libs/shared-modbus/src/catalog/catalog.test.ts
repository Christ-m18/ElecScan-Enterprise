import { describe, expect, it } from 'vitest';
import { POLLING_BLOCKS } from './blocks.js';
import {
  INSTRUCTIONS,
  INSTRUCTION_REGISTER_START,
  buildInstructionPayload,
  findInstruction,
} from './instructions.js';
import { REGISTERS, findRegister, harmonicAddress } from './registers.js';

describe('Instruction catalog', () => {
  it('includes the documented critical commands', () => {
    expect(findInstruction(1300)?.danger).toBe('high');
    expect(findInstruction(1301)?.danger).toBe('high');
    expect(findInstruction(6000)?.danger).toBe('high');
  });

  it('builds the manual example payload for set-time', () => {
    const spec = findInstruction(1200);
    if (!spec) throw new Error('missing spec');
    const payload = buildInstructionPayload(spec, {
      year: 2022,
      month: 7,
      day: 1,
      hour: 12,
      minute: 23,
      second: 25,
    });
    // instruction code + 6 UInt16 params
    expect(payload).toEqual([1200, 2022, 7, 1, 12, 23, 25]);
  });

  it('expands UInt32 parameters to 2 registers high-first', () => {
    const spec = findInstruction(1001);
    if (!spec) throw new Error('missing spec');
    const payload = buildInstructionPayload(spec, {
      wiringMode: 0,
      gridFrequency: 50,
      nominalVoltage: 230,
    });
    // code + UInt16 + UInt16 + UInt32(2)
    expect(payload).toEqual([1001, 0, 50, 0, 230]);
  });

  it('rejects payloads with missing parameters', () => {
    const spec = findInstruction(1200);
    if (!spec) throw new Error('missing spec');
    expect(() => buildInstructionPayload(spec, { year: 2022 })).toThrow(/missing/);
  });

  it('rejects out-of-range values', () => {
    const spec = findInstruction(1200);
    if (!spec) throw new Error('missing spec');
    expect(() =>
      buildInstructionPayload(spec, {
        year: 2200,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
      }),
    ).toThrow();
  });

  it('exposes the documented instruction register start', () => {
    expect(INSTRUCTION_REGISTER_START).toBe(300);
  });

  it('has all documented instruction codes', () => {
    const codes = INSTRUCTIONS.map((i) => i.code).sort((a, b) => a - b);
    expect(codes).toEqual([
      1001, 1002, 1003, 1005, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1060, 1070, 1080, 1090,
      1200, 1300, 1301, 1302, 6000,
    ]);
  });
});

describe('Register catalog', () => {
  it('locates aliases', () => {
    expect(findRegister('UA')?.address).toBe(1010);
    expect(findRegister('PTotal')?.address).toBe(1034);
  });

  it('computes harmonic addresses per documented pattern', () => {
    // I phase A 1st harmonic percent = 4018
    expect(harmonicAddress('I', 'A', 1, 'percent')).toBe(4018);
    expect(harmonicAddress('I', 'C', 1, 'percent')).toBe(4022);
    expect(harmonicAddress('I', 'A', 50, 'percent')).toBe(4312);
    expect(harmonicAddress('I', 'C', 50, 'value')).toBe(4698);
    expect(harmonicAddress('U', 'A', 1, 'value')).toBe(5400);
    expect(harmonicAddress('U', 'C', 50, 'value')).toBe(5698);
  });

  it('rejects out-of-range harmonics', () => {
    expect(() => harmonicAddress('I', 'A', 0, 'percent')).toThrow();
    expect(() => harmonicAddress('I', 'A', 51, 'percent')).toThrow();
  });

  it('exposes consistent register list', () => {
    expect(REGISTERS.length).toBeGreaterThan(50);
  });
});

describe('Polling blocks', () => {
  it('respects 125 register-per-read limit', () => {
    for (const b of POLLING_BLOCKS) {
      expect(b.registerCount).toBeLessThanOrEqual(125);
    }
  });
});
