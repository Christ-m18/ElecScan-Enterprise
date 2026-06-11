import type { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];
  private _version = 0;

  get version(): number {
    return this._version;
  }

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  protected recordEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this._version += 1;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
