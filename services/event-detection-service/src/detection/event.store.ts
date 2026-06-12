import { Injectable } from '@nestjs/common';
import type { PqEvent } from './event.entity.js';

const HISTORY_LIMIT = 500;

@Injectable()
export class EventStore {
  private readonly active = new Map<string, PqEvent>();
  private readonly history: PqEvent[] = [];

  startEvent(event: PqEvent): void {
    this.active.set(event.id, event);
  }

  updatePeak(id: string, peak: number): void {
    const ev = this.active.get(id);
    if (ev && Math.abs(peak) > Math.abs(ev.peakValue)) {
      ev.peakValue = peak;
    }
  }

  endEvent(id: string): void {
    const ev = this.active.get(id);
    if (!ev) return;
    ev.endedAt = new Date().toISOString();
    this.active.delete(id);
    this.history.push(ev);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
  }

  getActive(): PqEvent[] {
    return Array.from(this.active.values());
  }

  getActiveForDevice(deviceId: string): PqEvent[] {
    return this.getActive().filter((e) => e.deviceId === deviceId);
  }

  getHistory(): PqEvent[] {
    return [...this.history].reverse();
  }
}
