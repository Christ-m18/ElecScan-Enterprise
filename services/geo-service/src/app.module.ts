import { Module } from '@nestjs/common';
import { GeoController } from './geo/geo.controller.js';
import { GeoStore } from './geo/geo.store.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController, GeoController],
  providers: [GeoStore],
})
export class AppModule {}
