import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { AlarmPollService } from './alarm-poll/alarm-poll.service.js';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { NatsService } from './nats/nats.service.js';
import { WebhookController } from './webhook/webhook.controller.js';
import { WebhookStore } from './webhook/webhook.store.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';
const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

@Module({
  controllers: [HealthController, WebhookController],
  providers: [DatabaseService, WebhookStore, NatsService, AlarmPollService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: WebhookStore,
    private readonly nats: NatsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
    await this.store.loadFromDb();
    await this.nats.connect(NATS_URL);
  }
}
