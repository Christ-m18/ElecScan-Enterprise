import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export interface PendingApproval {
  readonly id: string;
  readonly deviceId: string;
  readonly instructionCode: number;
  readonly params: Record<string, number>;
  readonly requestedBy: string;
  readonly justification: string;
  readonly requestedAt: string;
  readonly expiresAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

const TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PendingApprovalStore {
  private readonly pending = new Map<string, PendingApproval>();

  create(
    deviceId: string,
    instructionCode: number,
    params: Record<string, number>,
    requestedBy: string,
    justification: string,
  ): PendingApproval {
    const now = new Date();
    const approval: PendingApproval = {
      id: randomUUID(),
      deviceId,
      instructionCode,
      params,
      requestedBy,
      justification,
      requestedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
      approvedBy: null,
      approvedAt: null,
    };
    this.pending.set(approval.id, approval);
    this.expireOld();
    return approval;
  }

  get(id: string): PendingApproval | undefined {
    const p = this.pending.get(id);
    if (p && new Date(p.expiresAt) < new Date()) {
      this.pending.delete(id);
      return undefined;
    }
    return p;
  }

  approve(id: string, approvedBy: string): PendingApproval | undefined {
    const p = this.get(id);
    if (!p) return undefined;
    p.approvedBy = approvedBy;
    p.approvedAt = new Date().toISOString();
    return p;
  }

  consume(id: string): PendingApproval | undefined {
    const p = this.get(id);
    if (p) this.pending.delete(id);
    return p;
  }

  listPending(): PendingApproval[] {
    this.expireOld();
    return Array.from(this.pending.values()).filter((p) => !p.approvedAt);
  }

  private expireOld(): void {
    const now = new Date();
    for (const [id, p] of this.pending) {
      if (new Date(p.expiresAt) < now) this.pending.delete(id);
    }
  }
}
