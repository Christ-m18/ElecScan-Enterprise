export type AlarmCondition = '>' | '<' | '>=' | '<=' | '==' | '!=';
export type AlarmSeverity = 'info' | 'warning' | 'critical';

export interface AlarmRule {
  readonly id: string;
  readonly name: string;
  readonly deviceId: string;
  readonly alias: string;
  readonly condition: AlarmCondition;
  readonly threshold: number;
  readonly severity: AlarmSeverity;
  readonly enabled: boolean;
  readonly createdAt: string;
}

export interface ActiveAlarm {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly deviceId: string;
  readonly alias: string;
  readonly severity: AlarmSeverity;
  readonly value: number;
  readonly threshold: number;
  readonly condition: AlarmCondition;
  readonly raisedAt: string;
  ackedAt: string | null;
  ackedBy: string | null;
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
