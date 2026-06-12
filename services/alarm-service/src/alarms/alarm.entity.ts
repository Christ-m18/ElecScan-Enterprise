import { randomUUID } from 'node:crypto';

export type AlarmCondition = '>' | '<' | '>=' | '<=' | '==' | '!=';
export type AlarmSeverity = 'info' | 'warning' | 'critical';
export type AlarmStatus = 'active' | 'acknowledged' | 'cleared';

export interface AlarmRule {
  id: string;
  name: string;
  deviceId: string;
  alias: string;
  condition: AlarmCondition;
  threshold: number;
  severity: AlarmSeverity;
  enabled: boolean;
  escalateAfterMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlarmInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  deviceId: string;
  alias: string;
  severity: AlarmSeverity;
  condition: AlarmCondition;
  threshold: number;
  value: number;
  status: AlarmStatus;
  raisedAt: string;
  ackedAt: string | null;
  ackedBy: string | null;
  clearedAt: string | null;
  escalatedAt: string | null;
}

export function makeRule(data: Omit<AlarmRule, 'id' | 'createdAt' | 'updatedAt'>): AlarmRule {
  const now = new Date().toISOString();
  return { ...data, id: randomUUID(), createdAt: now, updatedAt: now };
}

export function makeInstance(rule: AlarmRule, value: number): AlarmInstance {
  return {
    id: randomUUID(),
    ruleId: rule.id,
    ruleName: rule.name,
    deviceId: rule.deviceId,
    alias: rule.alias,
    severity: rule.severity,
    condition: rule.condition,
    threshold: rule.threshold,
    value,
    status: 'active',
    raisedAt: new Date().toISOString(),
    ackedAt: null,
    ackedBy: null,
    clearedAt: null,
    escalatedAt: null,
  };
}

export function evaluateCondition(
  value: number,
  condition: AlarmCondition,
  threshold: number,
): boolean {
  switch (condition) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '==':
      return value === threshold;
    case '!=':
      return value !== threshold;
  }
}
