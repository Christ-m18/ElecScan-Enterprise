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

export interface HistoryPoint {
  readonly ts: string;
  readonly value: number;
}

/** Last N readings per alias per device. */
const RING_CAPACITY = 600;

@Injectable()
export class SnapshotStore {
  private readonly latest = new Map<string, Map<string, SnapshotValue>>();
  private readonly history = new Map<string, Map<string, HistoryPoint[]>>();

  update(deviceId: string, entries: SnapshotEntry[]): void {
    let latestMap = this.latest.get(deviceId);
    if (!latestMap) {
      latestMap = new Map();
      this.latest.set(deviceId, latestMap);
    }
    let histMap = this.history.get(deviceId);
    if (!histMap) {
      histMap = new Map();
      this.history.set(deviceId, histMap);
    }

    const ts = new Date().toISOString();
    for (const e of entries) {
      const numVal = typeof e.value === 'bigint' ? Number(e.value) : e.value;
      const v: SnapshotValue =
        e.unit !== undefined
          ? { alias: e.alias, value: e.value, unit: e.unit, timestamp: ts }
          : { alias: e.alias, value: e.value, timestamp: ts };
      latestMap.set(e.alias, v);

      let ring = histMap.get(e.alias);
      if (!ring) {
        ring = [];
        histMap.set(e.alias, ring);
      }
      ring.push({ ts, value: numVal });
      if (ring.length > RING_CAPACITY) ring.shift();
    }
  }

  getLatest(deviceId: string): DeviceSnapshot {
    const map = this.latest.get(deviceId);
    const values: Record<string, SnapshotValue> = {};
    if (map) {
      for (const [alias, val] of map) {
        values[alias] = val;
      }
    }
    return { deviceId, updatedAt: new Date().toISOString(), values };
  }

  getHistory(
    deviceId: string,
    aliases: string[],
    sinceMs = 300_000,
  ): Record<string, HistoryPoint[]> {
    const histMap = this.history.get(deviceId);
    const cutoff = new Date(Date.now() - sinceMs).toISOString();
    const result: Record<string, HistoryPoint[]> = {};
    for (const alias of aliases) {
      const ring = histMap?.get(alias) ?? [];
      result[alias] = ring.filter((p) => p.ts >= cutoff);
    }
    return result;
  }

  clear(deviceId: string): void {
    this.latest.delete(deviceId);
    this.history.delete(deviceId);
  }
}
