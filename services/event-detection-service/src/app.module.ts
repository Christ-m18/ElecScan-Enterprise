import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';
import { DetectionController } from './detection/detection.controller.js';
import { DetectorService } from './detection/detector.service.js';
import { EventStore } from './detection/event.store.js';
import { HealthController } from './health/health.controller.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';

@Module({
  controllers: [HealthController, DetectionController],
  providers: [DatabaseService, EventStore, DetectorService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: EventStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
  }
}
