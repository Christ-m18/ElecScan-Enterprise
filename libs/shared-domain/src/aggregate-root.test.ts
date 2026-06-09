import { describe, expect, it } from 'vitest';
import { AggregateRoot } from './aggregate-root.js';
import { createDomainEvent } from './domain-event.js';

class TestAggregate extends AggregateRoot<string> {
  static create(id: string): TestAggregate {
    return new TestAggregate(id);
  }

  doSomething(): void {
    this.recordEvent(createDomainEvent('TestHappened', this.id, { ok: true }));
  }
}

describe('AggregateRoot', () => {
  it('records and exposes domain events', () => {
    const ag = TestAggregate.create('a-1');
    expect(ag.version).toBe(0);
    ag.doSomething();
    ag.doSomething();
    expect(ag.version).toBe(2);
    expect(ag.domainEvents).toHaveLength(2);
    expect(ag.domainEvents[0]?.type).toBe('TestHappened');
  });

  it('clears events', () => {
    const ag = TestAggregate.create('a-2');
    ag.doSomething();
    ag.clearEvents();
    expect(ag.domainEvents).toHaveLength(0);
  });
});
