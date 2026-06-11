import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';

/**
 * Append-only audit hash chain.
 *  hash_i = sha256(prev_hash_i-1 || canonical(payload_i))
 *
 * Storage of the chain itself happens in the repository (Prisma) in M5+.
 * Here we expose the pure functions so callers can compute and verify hashes.
 */
@Injectable()
export class HashChainService {
  hashPayload(payload: unknown): string {
    const canonical = this.canonicalJson(payload);
    return createHash('sha256').update(canonical).digest('hex');
  }

  chain(prevHash: string | null, payloadHash: string): string {
    const prev = prevHash ?? '0'.repeat(64);
    return createHash('sha256').update(prev).update(payloadHash).digest('hex');
  }

  verify(prevHash: string | null, payloadHash: string, expected: string): boolean {
    return this.chain(prevHash, payloadHash) === expected;
  }

  private canonicalJson(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) {
      return `[${value.map((v) => this.canonicalJson(v)).join(',')}]`;
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${this.canonicalJson(obj[k])}`);
    return `{${entries.join(',')}}`;
  }
}
