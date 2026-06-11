import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { SnapshotStore } from '../polling/snapshot.store.js';
import { evaluateCondition } from './alarm.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AlarmStore } from './alarm.store.js';

const EVAL_INTERVAL_MS = 5_000;

@Injectable()
export class AlarmDetector implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AlarmDetector.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly alarmStore: AlarmStore,
    private readonly snapshots: SnapshotStore,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => this.evaluate(), EVAL_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private evaluate(): void {
    const rules = this.alarmStore.getRules().filter((r) => r.enabled);
    for (const rule of rules) {
      const snapshot = this.snapshots.getLatest(rule.deviceId);
      const sv = snapshot.values[rule.alias];
      if (!sv) {
        this.alarmStore.clear(rule.id);
        continue;
      }
      const numVal = typeof sv.value === 'bigint' ? Number(sv.value) : Number(sv.value);
      const triggered = evaluateCondition(numVal, rule.condition, rule.threshold);
      if (triggered) {
        const raised = this.alarmStore.raise(rule.id, numVal);
        if (raised) {
          this.logger.warn(
            `ALARM [${rule.severity.toUpperCase()}] ${rule.name}: ${rule.alias}=${numVal} ${rule.condition} ${rule.threshold}`,
          );
        }
      } else {
        this.alarmStore.clear(rule.id);
      }
    }
  }
}
