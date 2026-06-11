import { Injectable } from '@nestjs/common';
import type { SnapshotEntry } from '../application/snapshot-decoder.js';

export interface SnapshotValue {
  readonly alias: string;
  readonly value: number | bigint;
  readonly unit?: string;
  readonly timestamp: string;
}

export interface DeviceSnapshot {
  readonly deviceId: string;
  readonly updatedAt: string;
  readonly values: Record<string, SnapshotValue>;
}

@Injectable()
export class SnapshotStore {
  private readonly store = new Map<string, Map<string, SnapshotValue>>();

  update(deviceId: string, entries: SnapshotEntry[]): void {
    let map = this.store.get(deviceId);
    if (!map) {
      map = new Map();
      this.store.set(deviceId, map);
    }
    const ts = new Date().toISOString();
    for (const e of entries) {
      const v: SnapshotValue =
        e.unit !== undefined
          ? { alias: e.alias, value: e.value, unit: e.unit, timestamp: ts }
          : { alias: e.alias, value: e.value, timestamp: ts };
      map.set(e.alias, v);
    }
  }

  getLatest(deviceId: string): DeviceSnapshot {
    const map = this.store.get(deviceId);
    const values: Record<string, SnapshotValue> = {};
    if (map) {
      for (const [alias, val] of map) {
        values[alias] = val;
      }
    }
    return { deviceId, updatedAt: new Date().toISOString(), values };
  }

  clear(deviceId: string): void {
    this.store.delete(deviceId);
  }
}
