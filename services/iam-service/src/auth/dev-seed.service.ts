import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { AuthService } from './auth.service.js';

const DEMO_TENANT_ID = '11111111-1111-4111-8111-111111111111';

const SEED_USERS = [
  { email: 'demo@elecscan.local', password: 'demo-password-12345' },
  { email: 'christopherjesusrosario@gmail.com', password: 'MI550PQA' },
] as const;

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(private readonly auth: AuthService) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const u of SEED_USERS) {
      try {
        await this.auth.signup(DEMO_TENANT_ID, u.email, u.password);
      } catch {
        // User already registered on a previous bootstrap — skip.
      }
    }
  }
}
