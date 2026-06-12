import { Injectable } from '@nestjs/common';
import {
  type AlarmInstance,
  type AlarmRule,
  type AlarmSeverity,
  makeInstance,
  makeRule,
} from './alarm.entity.js';

const MAX_HISTORY = 1_000;

@Injectable()
export class AlarmStore {
  private readonly rules = new Map<string, AlarmRule>();
  private readonly active = new Map<string, AlarmInstance>();
  private readonly history: AlarmInstance[] = [];

  // ── Rules ──────────────────────────────────────────────────────────────────

  addRule(data: {
    name: string;
    deviceId: string;
    alias: string;
    condition: AlarmRule['condition'];
    threshold: number;
    severity: AlarmSeverity;
    enabled: boolean;
    escalateAfterMs?: number;
  }): AlarmRule {
    const rule = makeRule({ ...data, escalateAfterMs: data.escalateAfterMs ?? 300_000 });
    this.rules.set(rule.id, rule);
    return rule;
  }

  getRule(id: string): AlarmRule | undefined {
    return this.rules.get(id);
  }

  getRules(): AlarmRule[] {
    return [...this.rules.values()];
  }

  updateRule(id: string, patch: Partial<Omit<AlarmRule, 'id' | 'createdAt'>>): AlarmRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    const updated: AlarmRule = { ...rule, ...patch, updatedAt: new Date().toISOString() };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  // ── Instances ──────────────────────────────────────────────────────────────

  raise(rule: AlarmRule, value: number): AlarmInstance | null {
    const key = `${rule.deviceId}:${rule.id}`;
    if (this.active.has(key)) return null;
    const instance = makeInstance(rule, value);
    this.active.set(key, instance);
    return instance;
  }

  acknowledge(instanceId: string, by: string): AlarmInstance | null {
    for (const [key, inst] of this.active) {
      if (inst.id === instanceId) {
        const updated: AlarmInstance = {
          ...inst,
          status: 'acknowledged',
          ackedAt: new Date().toISOString(),
          ackedBy: by,
        };
        this.active.set(key, updated);
        return updated;
      }
    }
    return null;
  }

  clear(ruleId: string, deviceId: string): AlarmInstance | null {
    const key = `${deviceId}:${ruleId}`;
    const inst = this.active.get(key);
    if (!inst) return null;
    const cleared: AlarmInstance = {
      ...inst,
      status: 'cleared',
      clearedAt: new Date().toISOString(),
    };
    this.active.delete(key);
    this.history.unshift(cleared);
    if (this.history.length > MAX_HISTORY) this.history.length = MAX_HISTORY;
    return cleared;
  }

  markEscalated(instanceId: string): void {
    for (const [key, inst] of this.active) {
      if (inst.id === instanceId) {
        this.active.set(key, { ...inst, escalatedAt: new Date().toISOString() });
        return;
      }
    }
  }

  getActive(): AlarmInstance[] {
    return [...this.active.values()];
  }

  getHistory(): AlarmInstance[] {
    return this.history;
  }
}
