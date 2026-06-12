import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { AlarmDetector } from './alarms/alarm.detector.js';
import { AlarmStore } from './alarms/alarm.store.js';
import { AlarmsController } from './alarms/alarms.controller.js';
import { MaintenanceStore } from './alarms/maintenance.store.js';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { NatsService } from './nats/nats.service.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';
const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

@Module({
  controllers: [HealthController, AlarmsController],
  providers: [DatabaseService, AlarmStore, MaintenanceStore, NatsService, AlarmDetector],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: AlarmStore,
    private readonly maintenance: MaintenanceStore,
    private readonly nats: NatsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
    this.maintenance.setDb(this.db);
    await this.store.onApplicationBootstrap();
    await this.maintenance.loadFromDb();
    await this.nats.connect(NATS_URL);
  }
}
