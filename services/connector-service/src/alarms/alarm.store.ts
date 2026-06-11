import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ActiveAlarm, AlarmRule } from './alarm.entity.js';

const MAX_HISTORY = 500;

@Injectable()
export class AlarmStore {
  private readonly rules = new Map<string, AlarmRule>();
  private readonly active = new Map<string, ActiveAlarm>();
  private readonly history: ActiveAlarm[] = [];

  // ── Rules ─────────────────────────────────────────────────────────────────

  addRule(rule: Omit<AlarmRule, 'id' | 'createdAt'>): AlarmRule {
    const full: AlarmRule = { ...rule, id: randomUUID(), createdAt: new Date().toISOString() };
    this.rules.set(full.id, full);
    return full;
  }

  getRules(): AlarmRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): AlarmRule | undefined {
    return this.rules.get(id);
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  updateRule(
    id: string,
    patch: Partial<Omit<AlarmRule, 'id' | 'createdAt'>>,
  ): AlarmRule | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    const updated: AlarmRule = { ...rule, ...patch };
    this.rules.set(id, updated);
    return updated;
  }

  // ── Active alarms ─────────────────────────────────────────────────────────

  raise(ruleId: string, value: number): ActiveAlarm | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;
    if (this.active.has(ruleId)) return this.active.get(ruleId) ?? null;
    const alarm: ActiveAlarm = {
      id: randomUUID(),
      ruleId,
      ruleName: rule.name,
      deviceId: rule.deviceId,
      alias: rule.alias,
      severity: rule.severity,
      value,
      threshold: rule.threshold,
      condition: rule.condition,
      raisedAt: new Date().toISOString(),
      ackedAt: null,
      ackedBy: null,
    };
    this.active.set(ruleId, alarm);
    return alarm;
  }

  clear(ruleId: string): void {
    const alarm = this.active.get(ruleId);
    if (alarm) {
      this.history.push(alarm);
      if (this.history.length > MAX_HISTORY) this.history.shift();
      this.active.delete(ruleId);
    }
  }

  acknowledge(alarmId: string, by: string): ActiveAlarm | undefined {
    for (const alarm of this.active.values()) {
      if (alarm.id === alarmId) {
        alarm.ackedAt = new Date().toISOString();
        alarm.ackedBy = by;
        return alarm;
      }
    }
    return undefined;
  }

  getActive(): ActiveAlarm[] {
    return Array.from(this.active.values()).sort(
      (a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime(),
    );
  }

  getHistory(limit = 100): ActiveAlarm[] {
    return this.history.slice(-limit).reverse();
  }
}
