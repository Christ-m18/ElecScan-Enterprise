import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { AlarmPollService } from './alarm-poll/alarm-poll.service.js';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { WebhookController } from './webhook/webhook.controller.js';
import { WebhookStore } from './webhook/webhook.store.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';

@Module({
  controllers: [HealthController, WebhookController],
  providers: [DatabaseService, WebhookStore, AlarmPollService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: WebhookStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
    await this.store.loadFromDb();
  }
}
