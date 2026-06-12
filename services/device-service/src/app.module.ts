import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { CatalogController } from './catalog/catalog.controller.js';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { ProfileStore } from './profiles/profile.store.js';
import { ProfilesController } from './profiles/profiles.controller.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';

@Module({
  controllers: [HealthController, CatalogController, ProfilesController],
  providers: [DatabaseService, ProfileStore],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: ProfileStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
  }
}
