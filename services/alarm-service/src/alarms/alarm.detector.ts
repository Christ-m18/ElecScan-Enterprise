import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { evaluateCondition } from './alarm.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AlarmStore } from './alarm.store.js';

const INGEST_URL = process.env.INGEST_SERVICE_URL ?? 'http://127.0.0.1:4004';
const EVAL_INTERVAL_MS = 5_000;
const ESCALATION_CHECK_MS = 30_000;

interface NormalizedSnapshot {
  deviceId: string;
  values: Record<string, number>;
}

@Injectable()
export class AlarmDetector implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AlarmDetector.name);
  private evalTimer: NodeJS.Timeout | null = null;
  private escalationTimer: NodeJS.Timeout | null = null;

  constructor(private readonly store: AlarmStore) {}

  onApplicationBootstrap(): void {
    this.evalTimer = setInterval(() => void this.evaluate(), EVAL_INTERVAL_MS);
    this.escalationTimer = setInterval(() => this.checkEscalations(), ESCALATION_CHECK_MS);
  }

  onApplicationShutdown(): void {
    if (this.evalTimer) clearInterval(this.evalTimer);
    if (this.escalationTimer) clearInterval(this.escalationTimer);
  }

  private async evaluate(): Promise<void> {
    try {
      const r = await fetch(`${INGEST_URL}/ingest/snapshots`);
      if (!r.ok) return;
      const snaps = (await r.json()) as NormalizedSnapshot[];
      const byDevice = new Map<string, NormalizedSnapshot>(snaps.map((s) => [s.deviceId, s]));

      for (const rule of this.store.getRules()) {
        if (!rule.enabled) continue;
        const snap = byDevice.get(rule.deviceId);
        const val = snap?.values[rule.alias];
        if (val === undefined) {
          this.store.clear(rule.id, rule.deviceId);
          continue;
        }
        const triggered = evaluateCondition(val, rule.condition, rule.threshold);
        if (triggered) {
          const inst = this.store.raise(rule, val);
          if (inst) {
            this.logger.warn(
              `[ALARM/${rule.severity.toUpperCase()}] ${rule.name}: ${rule.alias}=${val} ${rule.condition} ${rule.threshold}`,
            );
          }
        } else {
          this.store.clear(rule.id, rule.deviceId);
        }
      }
    } catch {
      // ingest unavailable — silent
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
        this.store.markEscalated(inst.id);
        this.logger.warn(
          `[ESCALATED] ${inst.ruleName} on ${inst.deviceId} (${Math.round(age / 1000)}s unacked)`,
        );
      }
    }
  }
}
