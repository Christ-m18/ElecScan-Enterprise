import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { CatalogController } from './catalog/catalog.controller.js';

@Module({
  controllers: [HealthController, CatalogController],
})
export class AppModule {}
