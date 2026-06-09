import { Injectable } from '@nestjs/common';

export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  status: 'active' | 'invited' | 'disabled';
  mfaEnrolled: boolean;
  createdAt: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  insert(user: UserRecord): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * In-memory repository used in M0 for development and tests.
 * Prisma-backed implementation arrives in M5 (Multitenancy + RBAC sprint).
 */
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly byEmail = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async insert(user: UserRecord): Promise<void> {
    const k = user.email.toLowerCase();
    if (this.byEmail.has(k)) {
      throw new Error('email already registered');
    }
    this.byEmail.set(k, user);
  }
}
