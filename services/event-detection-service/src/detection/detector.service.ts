import { randomUUID } from 'node:crypto';
import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { NatsService } from '../nats/nats.service.js';
import type { PqEvent, PqEventType, PqPhase } from './event.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { EventStore } from './event.store.js';
import { THRESHOLDS } from './pq-thresholds.js';

const INGEST_URL = process.env.INGEST_SERVICE_URL ?? 'http://127.0.0.1:4004';
const POLL_MS = 30_000; // fallback poll when NATS unavailable
const NATS_STREAM = 'TELEMETRY';
const NATS_SUBJECT = 'telemetry.normalized.v1';
const NATS_DURABLE = 'event-detection-svc';

interface NormalizedSnapshot {
  deviceId: string;
  values: Record<string, number>;
}

type PhaseData = { alias: string; phase: PqPhase }[];

const VOLTAGE_PHASES: PhaseData = [
  { alias: 'voltage_l1', phase: 'L1' },
  { alias: 'voltage_l2', phase: 'L2' },
  { alias: 'voltage_l3', phase: 'L3' },
];

@Injectable()
export class DetectorService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly activeKeys = new Map<string, string>();

  constructor(
    private readonly store: EventStore,
    private readonly nats: NatsService,
  ) {}

  onApplicationBootstrap(): void {
    // NATS subscription (primary path — real-time)
    void this.nats.subscribe(NATS_STREAM, NATS_SUBJECT, NATS_DURABLE, (data) => {
      this.detect(data as NormalizedSnapshot);
    });

    // HTTP poll fallback (keeps working if NATS unavailable)
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    if (this.nats.available) return; // NATS is handling detection
    try {
      const r = await fetch(`${INGEST_URL}/ingest/snapshots`);
      if (!r.ok) return;
      const snaps = (await r.json()) as NormalizedSnapshot[];
      for (const snap of snaps) this.detect(snap);
    } catch {
      // ingest unavailable — silent
    }
  }

  private detect(snap: NormalizedSnapshot): void {
    const v = snap.values;

    // Voltage events per phase
    for (const { alias, phase } of VOLTAGE_PHASES) {
      const val = v[alias];
      if (val === undefined) continue;

      this.check(
        snap.deviceId,
        phase,
        'voltage_interruption',
        val,
        val < THRESHOLDS.interruption,
        val >= THRESHOLDS.dip_end,
      );
      this.check(
        snap.deviceId,
        phase,
        'voltage_dip',
        val,
        val < THRESHOLDS.dip_start && val >= THRESHOLDS.interruption,
        val >= THRESHOLDS.dip_end,
      );
      this.check(
        snap.deviceId,
        phase,
        'voltage_swell',
        val,
        val > THRESHOLDS.swell_start,
        val <= THRESHOLDS.swell_end,
      );
      this.check(
        snap.deviceId,
        phase,
        'undervoltage',
        val,
        val < THRESHOLDS.undervoltage_start,
        val >= THRESHOLDS.undervoltage_end,
      );
      this.check(
        snap.deviceId,
        phase,
        'overvoltage',
        val,
        val > THRESHOLDS.overvoltage_start,
        val <= THRESHOLDS.overvoltage_end,
      );
    }

    // Frequency events
    const freq = v.frequency;
    if (freq !== undefined) {
      this.check(
        snap.deviceId,
        'ALL',
        'overfrequency',
        freq,
        freq > THRESHOLDS.overfreq_start,
        freq <= THRESHOLDS.overfreq_end,
      );
      this.check(
        snap.deviceId,
        'ALL',
        'underfrequency',
        freq,
        freq < THRESHOLDS.underfreq_start,
        freq >= THRESHOLDS.underfreq_end,
      );
    }

    // Voltage unbalance
    const vl1 = v.voltage_l1;
    const vl2 = v.voltage_l2;
    const vl3 = v.voltage_l3;
    if (vl1 !== undefined && vl2 !== undefined && vl3 !== undefined) {
      const avg = (vl1 + vl2 + vl3) / 3;
      if (avg > 0) {
        const maxDev = Math.max(Math.abs(vl1 - avg), Math.abs(vl2 - avg), Math.abs(vl3 - avg));
        const unbalancePct = (maxDev / avg) * 100;
        this.check(
          snap.deviceId,
          'ALL',
          'voltage_unbalance',
          unbalancePct,
          unbalancePct > THRESHOLDS.unbalance_pct,
          unbalancePct <= THRESHOLDS.unbalance_pct * 0.8,
        );
      }
    }

    // THD
    const thd = v.thd_voltage_l1;
    if (thd !== undefined) {
      this.check(
        snap.deviceId,
        'L1',
        'high_thd',
        thd,
        thd > THRESHOLDS.thd_pct,
        thd <= THRESHOLDS.thd_pct * 0.8,
      );
    }
  }

  private check(
    deviceId: string,
    phase: PqPhase,
    type: PqEventType,
    value: number,
    condition: boolean,
    clearCondition: boolean,
  ): void {
    const key = `${deviceId}:${type}:${phase}`;
    const existingId = this.activeKeys.get(key);

    if (condition && !existingId) {
      const threshold = this.nominalThreshold(type);
      const event: PqEvent = {
        id: randomUUID(),
        deviceId,
        type,
        phase,
        startedAt: new Date().toISOString(),
        endedAt: null,
        triggerValue: value,
        peakValue: value,
        threshold,
      };
      this.store.startEvent(event);
      this.activeKeys.set(key, event.id);
    } else if (existingId) {
      this.store.updatePeak(existingId, value);
      if (clearCondition) {
        this.store.endEvent(existingId);
        this.activeKeys.delete(key);
      }
    }
  }

  private nominalThreshold(type: PqEventType): number {
    switch (type) {
      case 'voltage_swell':
        return THRESHOLDS.swell_start;
      case 'voltage_dip':
        return THRESHOLDS.dip_start;
      case 'voltage_interruption':
        return THRESHOLDS.interruption;
      case 'overvoltage':
        return THRESHOLDS.overvoltage_start;
      case 'undervoltage':
        return THRESHOLDS.undervoltage_start;
      case 'overfrequency':
        return THRESHOLDS.overfreq_start;
      case 'underfrequency':
        return THRESHOLDS.underfreq_start;
      case 'voltage_unbalance':
        return THRESHOLDS.unbalance_pct;
      case 'high_thd':
        return THRESHOLDS.thd_pct;
    }
  }
}
