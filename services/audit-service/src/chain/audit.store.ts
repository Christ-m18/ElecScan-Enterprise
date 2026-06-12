import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { HashChainService } from './hash-chain.service.js';

export interface AuditEvent {
  id: string;
  ts: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  detail: unknown;
  payloadHash: string;
  chainHash: string;
}

@Injectable()
export class AuditStore {
  private readonly events: AuditEvent[] = [];

  constructor(private readonly chain: HashChainService) {}

  append(input: {
    tenantId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    detail?: unknown;
  }): AuditEvent {
    const prev = this.events.at(-1) ?? null;
    const id = randomUUID();
    const ts = new Date().toISOString();
    const payload = { id, ts, ...input };
    const payloadHash = this.chain.hashPayload(payload);
    const chainHash = this.chain.chain(prev?.chainHash ?? null, payloadHash);

    const event: AuditEvent = { ...payload, detail: input.detail ?? null, payloadHash, chainHash };
    this.events.push(event);
    return event;
  }

  list(tenantId?: string, limit = 200): AuditEvent[] {
    const filtered = tenantId ? this.events.filter((e) => e.tenantId === tenantId) : this.events;
    return filtered.slice(-limit).reverse();
  }

  verify(): { valid: boolean; brokenAt?: string } {
    let prev: AuditEvent | null = null;
    for (const ev of this.events) {
      const ok = this.chain.verify(prev?.chainHash ?? null, ev.payloadHash, ev.chainHash);
      if (!ok) return { valid: false, brokenAt: ev.id };
      prev = ev;
    }
    return { valid: true };
  }
}
