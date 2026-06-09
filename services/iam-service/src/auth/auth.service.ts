import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';
import {
  type IUserRepository,
  USER_REPOSITORY,
  type UserRecord,
} from './user.repository.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {
    const access = process.env['JWT_ACCESS_SECRET'] ?? 'dev-only-access-secret-please-rotate';
    const refresh = process.env['JWT_REFRESH_SECRET'] ?? 'dev-only-refresh-secret-please-rotate';
    this.accessSecret = new TextEncoder().encode(access);
    this.refreshSecret = new TextEncoder().encode(refresh);
  }

  async signup(tenantId: string, email: string, password: string): Promise<{ userId: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('email already registered');
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const record: UserRecord = {
      id: randomUUID(),
      tenantId,
      email: email.toLowerCase(),
      passwordHash: hash,
      status: 'active',
      mfaEnrolled: false,
      createdAt: new Date().toISOString(),
    };
    await this.users.insert(record);
    return { userId: record.id };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('invalid credentials');
    if (user.status !== 'active') throw new UnauthorizedException('user not active');
    return this.issueTokens(user);
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await new SignJWT({ tid: user.tenantId, eml: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60)
      .setIssuer('elecscan-iam')
      .setAudience('elecscan-api')
      .sign(this.accessSecret);
    const refreshToken = await new SignJWT({ tid: user.tenantId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(now + 30 * 24 * 3600)
      .setIssuer('elecscan-iam')
      .setAudience('elecscan-refresh')
      .sign(this.refreshSecret);
    return { accessToken, refreshToken };
  }
}
