import { Module } from '@nestjs/common';
import { AlarmController } from './alarms/alarm.controller.js';
import { AlarmDetector } from './alarms/alarm.detector.js';
import { AlarmStore } from './alarms/alarm.store.js';
import { SnapshotDecoder } from './application/snapshot-decoder.js';
import { ConfigController } from './config/config.controller.js';
import { ConfigService } from './config/config.service.js';
import { DevicesController } from './devices/devices.controller.js';
import { DevicesRepository } from './devices/devices.repository.js';
import { HealthController } from './health/health.controller.js';
import { PollingEngine } from './polling/polling.engine.js';
import { SnapshotStore } from './polling/snapshot.store.js';

@Module({
  controllers: [HealthController, DevicesController, ConfigController, AlarmController],
  providers: [
    DevicesRepository,
    SnapshotDecoder,
    PollingEngine,
    SnapshotStore,
    ConfigService,
    AlarmStore,
    AlarmDetector,
  ],
})
export class AppModule {}
