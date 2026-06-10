import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { DevSeedService } from './auth/dev-seed.service.js';
import { InMemoryUserRepository, USER_REPOSITORY } from './auth/user.repository.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController, AuthController],
  providers: [
    AuthService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    DevSeedService,
  ],
})
export class AppModule {}
