import { Module } from '@nestjs/common';
import { SnapshotDecoder } from './application/snapshot-decoder.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [SnapshotDecoder],
})
export class AppModule {}
