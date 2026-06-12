import { Module } from '@nestjs/common';
import { CatalogController } from './catalog/catalog.controller.js';
import { HealthController } from './health/health.controller.js';
import { ProfileStore } from './profiles/profile.store.js';
import { ProfilesController } from './profiles/profiles.controller.js';

@Module({
  controllers: [HealthController, CatalogController, ProfilesController],
  providers: [ProfileStore],
})
export class AppModule {}
