import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { AlarmController } from './alarms/alarm.controller.js';
import { AlarmDetector } from './alarms/alarm.detector.js';
import { AlarmStore } from './alarms/alarm.store.js';
import { SnapshotDecoder } from './application/snapshot-decoder.js';
import { RateLimitMiddleware } from './common/rate-limit.middleware.js';
import { ConfigController } from './config/config.controller.js';
import { ConfigService } from './config/config.service.js';
import { PendingApprovalStore } from './config/pending-approval.store.js';
import { DevicesController } from './devices/devices.controller.js';
import { DevicesRepository } from './devices/devices.repository.js';
import { HealthController } from './health/health.controller.js';
import { NatsService } from './nats/nats.service.js';
import { PollingEngine } from './polling/polling.engine.js';
import { SnapshotStore } from './polling/snapshot.store.js';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

@Module({
  controllers: [HealthController, DevicesController, ConfigController, AlarmController],
  providers: [
    DevicesRepository,
    SnapshotDecoder,
    NatsService,
    PollingEngine,
    SnapshotStore,
    ConfigService,
    PendingApprovalStore,
    AlarmStore,
    AlarmDetector,
  ],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly nats: NatsService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.nats.connect(NATS_URL);
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
