import { Injectable } from '@nestjs/common';
import {
  decodeFloat32,
  decodeInt64,
  decodeUInt16,
  decodeUInt32,
  type PollingBlock,
  REGISTERS,
} from '@elecscan/shared-modbus';

export interface SnapshotEntry {
  alias: string;
  value: number | bigint;
  unit?: string;
}

/**
 * Decode a contiguous register block read from FC 0x03 into a list of
 * canonical SnapshotEntry items using the shared register catalog.
 *
 * Registers outside the block start/length window are skipped silently;
 * callers can therefore reuse the same block layout when partial reads happen.
 */
@Injectable()
export class SnapshotDecoder {
  decodeBlock(block: PollingBlock, registers: ReadonlyArray<number>): SnapshotEntry[] {
    if (registers.length < block.registerCount) {
      throw new RangeError(
        `decodeBlock(${block.id}): expected at least ${block.registerCount} regs, got ${registers.length}`,
      );
    }
    const out: SnapshotEntry[] = [];
    const blockEnd = block.startAddress + block.registerCount;
    for (const r of REGISTERS) {
      const start = r.address;
      const end = r.address + r.size;
      if (start < block.startAddress || end > blockEnd) continue;
      const offset = start - block.startAddress;
      const slice = registers.slice(offset, offset + r.size);
      const entry: SnapshotEntry = {
        alias: r.alias,
        value: this.decodeOne(r.type, slice),
      };
      if (r.unit) entry.unit = r.unit;
      out.push(entry);
    }
    return out;
  }

  private decodeOne(
    type: 'UInt16' | 'Int16' | 'UInt32' | 'Int32' | 'UInt64' | 'Int64' | 'Float32' | 'Float64' | 'UTF8' | 'DateTime' | 'IPaddr',
    slice: ReadonlyArray<number>,
  ): number | bigint {
    switch (type) {
      case 'UInt16':
        return decodeUInt16(slice);
      case 'UInt32':
        return decodeUInt32(slice);
      case 'Float32':
        return decodeFloat32(slice);
      case 'Int64':
        return decodeInt64(slice);
      default:
        // We only decode the alias types reachable in our polling blocks here.
        // DateTime/UTF8/IPaddr are handled by dedicated paths in the connector.
        throw new Error(`decoder: type ${type} not handled by SnapshotDecoder`);
    }
  }
}
