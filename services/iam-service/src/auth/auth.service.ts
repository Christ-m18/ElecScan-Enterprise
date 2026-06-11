import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { type JWTVerifyResult, SignJWT, jwtVerify } from 'jose';
import {
  type IUserRepository,
  USER_REPOSITORY,
  type UserRecord,
  type UserRole,
} from './user.repository.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtAccessPayload {
  sub: string;
  tid: string;
  eml: string;
  rol: UserRole;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {
    const access = process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret-please-rotate';
    const refresh = process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret-please-rotate';
    this.accessSecret = new TextEncoder().encode(access);
    this.refreshSecret = new TextEncoder().encode(refresh);
  }

  async signup(
    tenantId: string,
    email: string,
    password: string,
    role: UserRole = 'viewer',
    hashOptions?: argon2.Options,
  ): Promise<{ userId: string }> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('email already registered');
    const hash = await argon2.hash(password, { type: argon2.argon2id, ...hashOptions });
    const record: UserRecord = {
      id: randomUUID(),
      tenantId,
      email: email.toLowerCase(),
      passwordHash: hash,
      role,
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

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let verified: JWTVerifyResult;
    try {
      verified = await jwtVerify(refreshToken, this.refreshSecret, {
        issuer: 'elecscan-iam',
        audience: 'elecscan-refresh',
      });
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
    const userId = verified.payload.sub;
    if (!userId) throw new UnauthorizedException('missing sub');
    const user = await this.users.findById(userId);
    if (!user || user.status !== 'active') throw new UnauthorizedException('user not active');
    return this.issueTokens(user);
  }

  async me(accessToken: string): Promise<Omit<UserRecord, 'passwordHash'>> {
    let verified: JWTVerifyResult;
    try {
      verified = await jwtVerify(accessToken, this.accessSecret, {
        issuer: 'elecscan-iam',
        audience: 'elecscan-api',
      });
    } catch {
      throw new UnauthorizedException('invalid token');
    }
    const userId = verified.payload.sub;
    if (!userId) throw new UnauthorizedException('missing sub');
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('user not found');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async listUsers(): Promise<Omit<UserRecord, 'passwordHash'>[]> {
    const all = await this.users.findAll();
    return all.map(({ passwordHash: _, ...safe }) => safe);
  }

  async setRole(
    targetUserId: string,
    role: UserRole,
  ): Promise<Omit<UserRecord, 'passwordHash'> | null> {
    const updated = await this.users.updateRole(targetUserId, role);
    if (!updated) return null;
    const { passwordHash: _, ...safe } = updated;
    return safe;
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await new SignJWT({ tid: user.tenantId, eml: user.email, rol: user.role })
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
