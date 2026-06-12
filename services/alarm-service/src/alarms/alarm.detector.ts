import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { NatsService } from '../nats/nats.service.js';
import { evaluateCondition } from './alarm.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AlarmStore } from './alarm.store.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { MaintenanceStore } from './maintenance.store.js';

const INGEST_URL = process.env.INGEST_SERVICE_URL ?? 'http://127.0.0.1:4004';
const EVAL_INTERVAL_MS = 30_000;
const ESCALATION_CHECK_MS = 30_000;
const NATS_STREAM = 'TELEMETRY';
const NATS_SUBJECT = 'telemetry.normalized.v1';
const NATS_DURABLE = 'alarm-svc';

interface NormalizedSnapshot {
  deviceId: string;
  values: Record<string, number>;
}

@Injectable()
export class AlarmDetector implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AlarmDetector.name);
  private evalTimer: NodeJS.Timeout | null = null;
  private escalationTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly store: AlarmStore,
    private readonly maintenance: MaintenanceStore,
    private readonly nats: NatsService,
  ) {}

  onApplicationBootstrap(): void {
    void this.nats.subscribe(NATS_STREAM, NATS_SUBJECT, NATS_DURABLE, (data) => {
      void this.evaluateSnapshot(data as NormalizedSnapshot);
    });

    this.evalTimer = setInterval(() => void this.evaluate(), EVAL_INTERVAL_MS);
    this.escalationTimer = setInterval(() => this.checkEscalations(), ESCALATION_CHECK_MS);
  }

  onApplicationShutdown(): void {
    if (this.evalTimer) clearInterval(this.evalTimer);
    if (this.escalationTimer) clearInterval(this.escalationTimer);
  }

  private async evaluate(): Promise<void> {
    if (this.nats.available) return;
    try {
      const r = await fetch(`${INGEST_URL}/ingest/snapshots`);
      if (!r.ok) return;
      const snaps = (await r.json()) as NormalizedSnapshot[];
      for (const snap of snaps) await this.evaluateSnapshot(snap);
    } catch {
      // ingest unavailable — silent
    }
  }

  private async evaluateSnapshot(snap: NormalizedSnapshot): Promise<void> {
    if (this.maintenance.isActive(snap.deviceId)) return;

    const rules = this.store.getRules().filter((r) => r.deviceId === snap.deviceId && r.enabled);
    for (const rule of rules) {
      const val = snap.values[rule.alias];
      if (val === undefined) {
        await this.store.clear(rule.id, rule.deviceId);
        continue;
      }
      const triggered = evaluateCondition(val, rule.condition, rule.threshold);
      if (triggered) {
        const inst = await this.store.raise(rule, val);
        if (inst) {
          this.logger.warn(
            `[ALARM/${rule.severity.toUpperCase()}] ${rule.name}: ${rule.alias}=${val} ${rule.condition} ${rule.threshold}`,
          );
          void this.nats.publish('alarm.raised.v1', inst);
        }
      } else {
        await this.store.clear(rule.id, rule.deviceId);
      }
    }
  }

  private checkEscalations(): void {
    const now = Date.now();
    for (const inst of this.store.getActive()) {
      if (inst.escalatedAt || inst.status === 'acknowledged') continue;
      const rule = this.store.getRule(inst.ruleId);
      if (!rule) continue;
      const age = now - new Date(inst.raisedAt).getTime();
      if (age >= rule.escalateAfterMs) {
        void this.store.markEscalated(inst.id).then(() => {
          void this.nats.publish('alarm.escalated.v1', {
            ...inst,
            escalatedAt: new Date().toISOString(),
          });
        });
        this.logger.warn(
          `[ESCALATED] ${inst.ruleName} on ${inst.deviceId} (${Math.round(age / 1000)}s unacked)`,
        );
      }
    }
  }
}
