import { Module } from '@nestjs/common';
import { AlarmDetector } from './alarms/alarm.detector.js';
import { AlarmStore } from './alarms/alarm.store.js';
import { AlarmsController } from './alarms/alarms.controller.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController, AlarmsController],
  providers: [AlarmStore, AlarmDetector],
})
export class AppModule {}
