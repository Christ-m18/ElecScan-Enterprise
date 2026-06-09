import { describe, expect, it } from 'vitest';
import { encodeFloat32, POLLING_BLOCKS } from '@elecscan/shared-modbus';
import { SnapshotDecoder } from './snapshot-decoder.js';

function fillRealtimeBlock(): number[] {
  const block = POLLING_BLOCKS.find((b) => b.id === 'B1-realtime');
  if (!block) throw new Error('missing realtime block');
  const regs = new Array<number>(block.registerCount).fill(0);
  const set = (alias: string, value: number) => {
    // map alias to offset using the catalog directly
    const start = block.startAddress;
    const offsets: Record<string, number> = {
      IA: 1000 - start,
      UA: 1010 - start,
      PTotal: 1034 - start,
      FreqTotal: 1074 - start,
    };
    const off = offsets[alias];
    if (off === undefined) throw new Error(`no offset for ${alias}`);
    const [hi, lo] = encodeFloat32(value);
    regs[off] = hi;
    regs[off + 1] = lo;
  };
  set('IA', 12.5);
  set('UA', 219.8);
  set('PTotal', 8.2);
  set('FreqTotal', 49.998);
  return regs;
}

describe('SnapshotDecoder', () => {
  const decoder = new SnapshotDecoder();
  const block = POLLING_BLOCKS.find((b) => b.id === 'B1-realtime');
  if (!block) throw new Error('block missing');

  it('decodes documented aliases inside the block', () => {
    const regs = fillRealtimeBlock();
    const out = decoder.decodeBlock(block, regs);
    const byAlias = new Map(out.map((e) => [e.alias, e.value]));
    expect(byAlias.get('IA')).toBeCloseTo(12.5, 3);
    expect(byAlias.get('UA')).toBeCloseTo(219.8, 3);
    expect(byAlias.get('PTotal')).toBeCloseTo(8.2, 3);
    expect(byAlias.get('FreqTotal')).toBeCloseTo(49.998, 3);
  });

  it('throws on short input', () => {
    expect(() => decoder.decodeBlock(block, [])).toThrow();
  });
});
