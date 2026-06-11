import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { MlController } from './ml.controller.js';

@Module({ controllers: [HealthController, MlController] })
export class AppModule {}
