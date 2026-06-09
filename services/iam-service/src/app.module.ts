import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { InMemoryUserRepository, USER_REPOSITORY } from './auth/user.repository.js';

@Module({
  controllers: [HealthController, AuthController],
  providers: [
    AuthService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
})
export class AppModule {}
