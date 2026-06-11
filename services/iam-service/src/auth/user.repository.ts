import { Injectable } from '@nestjs/common';

export type UserRole =
  | 'superadmin'
  | 'tenant-admin'
  | 'site-manager'
  | 'operator'
  | 'analyst'
  | 'viewer';

export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: 'active' | 'invited' | 'disabled';
  mfaEnrolled: boolean;
  createdAt: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findAll(): Promise<UserRecord[]>;
  insert(user: UserRecord): Promise<void>;
  updateRole(id: string, role: UserRole): Promise<UserRecord | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly byEmail = new Map<string, UserRecord>();
  private readonly byId = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findAll(): Promise<UserRecord[]> {
    return Array.from(this.byId.values());
  }

  async insert(user: UserRecord): Promise<void> {
    const k = user.email.toLowerCase();
    if (this.byEmail.has(k)) throw new Error('email already registered');
    this.byEmail.set(k, user);
    this.byId.set(user.id, user);
  }

  async updateRole(id: string, role: UserRole): Promise<UserRecord | null> {
    const user = this.byId.get(id);
    if (!user) return null;
    const updated: UserRecord = { ...user, role };
    this.byEmail.set(user.email.toLowerCase(), updated);
    this.byId.set(id, updated);
    return updated;
  }
}
