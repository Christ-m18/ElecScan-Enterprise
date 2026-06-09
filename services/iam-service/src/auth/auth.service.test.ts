import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service.js';
import { InMemoryUserRepository } from './user.repository.js';

const TENANT_ID = '00000000-0000-4000-8000-000000000000';

describe('AuthService', () => {
  it('signs up and then logs in successfully', async () => {
    const svc = new AuthService(new InMemoryUserRepository());
    const { userId } = await svc.signup(TENANT_ID, 'alice@example.com', 'password-12345');
    expect(userId).toMatch(/^[0-9a-f-]{36}$/);

    const tokens = await svc.login('alice@example.com', 'password-12345');
    expect(tokens.accessToken.split('.')).toHaveLength(3);
    expect(tokens.refreshToken.split('.')).toHaveLength(3);
  });

  it('rejects duplicate signup', async () => {
    const svc = new AuthService(new InMemoryUserRepository());
    await svc.signup(TENANT_ID, 'bob@example.com', 'password-12345');
    await expect(svc.signup(TENANT_ID, 'bob@example.com', 'password-12345')).rejects.toThrow();
  });

  it('rejects wrong password', async () => {
    const svc = new AuthService(new InMemoryUserRepository());
    await svc.signup(TENANT_ID, 'carol@example.com', 'password-12345');
    await expect(svc.login('carol@example.com', 'wrong-password-xx')).rejects.toThrow();
  });

  it('rejects unknown email', async () => {
    const svc = new AuthService(new InMemoryUserRepository());
    await expect(svc.login('nobody@example.com', 'whatever-12345')).rejects.toThrow();
  });
});
