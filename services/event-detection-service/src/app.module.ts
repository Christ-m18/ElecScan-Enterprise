import { Module } from '@nestjs/common';
import { DetectionController } from './detection/detection.controller.js';
import { DetectorService } from './detection/detector.service.js';
import { EventStore } from './detection/event.store.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController, DetectionController],
  providers: [EventStore, DetectorService],
})
export class AppModule {}
