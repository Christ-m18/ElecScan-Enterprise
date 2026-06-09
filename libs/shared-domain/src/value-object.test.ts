import { describe, expect, it } from 'vitest';
import { ValueObject } from './value-object.js';

class Money extends ValueObject<{ amount: number; currency: string }> {
  static of(amount: number, currency: string): Money {
    return new Money({ amount, currency });
  }
}

describe('ValueObject', () => {
  it('is equal when props match', () => {
    expect(Money.of(10, 'USD').equals(Money.of(10, 'USD'))).toBe(true);
  });

  it('is not equal when props differ', () => {
    expect(Money.of(10, 'USD').equals(Money.of(20, 'USD'))).toBe(false);
  });

  it('handles null comparisons', () => {
    expect(Money.of(1, 'USD').equals(null)).toBe(false);
    expect(Money.of(1, 'USD').equals(undefined)).toBe(false);
  });
});
