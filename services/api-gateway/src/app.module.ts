import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { ProxyController } from './proxy/proxy.controller.js';

@Module({
  controllers: [HealthController, ProxyController],
})
export class AppModule {}
