import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';

describe('CatalogController', () => {
  const ctrl = new CatalogController();

  it('lists registers', () => {
    expect(ctrl.registers().length).toBeGreaterThan(0);
  });

  it('finds a known register', () => {
    expect(ctrl.register('UA').address).toBe(1010);
  });

  it('throws on unknown register alias', () => {
    expect(() => ctrl.register('NOPE')).toThrow(NotFoundException);
  });

  it('finds instruction 1200', () => {
    expect(ctrl.instruction('1200').label).toMatch(/time/i);
  });

  it('throws on unknown instruction', () => {
    expect(() => ctrl.instruction('99999')).toThrow(NotFoundException);
  });
});
