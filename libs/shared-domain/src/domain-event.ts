export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export function createDomainEvent(
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
): DomainEvent {
  return Object.freeze({
    type,
    aggregateId,
    occurredAt: new Date(),
    payload: Object.freeze({ ...payload }),
  });
}
