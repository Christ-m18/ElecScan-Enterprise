import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { AuthService } from './auth.service.js';

const DEMO_TENANT_ID = '11111111-1111-4111-8111-111111111111';

const SEED_USERS = [
  { email: 'demo@elecscan.local', password: 'demo-password-12345', role: 'operator' as const },
  {
    email: 'christopherjesusrosario@gmail.com',
    password: 'MI550PQA',
    role: 'tenant-admin' as const,
  },
] as const;

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const u of SEED_USERS) {
      try {
        await this.auth.signup(DEMO_TENANT_ID, u.email, u.password, u.role, {
          memoryCost: 4096,
          timeCost: 2,
          parallelism: 1,
        });
      } catch {
        // User already registered on a previous bootstrap — skip.
      }
    }
  }
}
