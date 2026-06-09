import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { SnapshotDecoder } from './application/snapshot-decoder.js';

@Module({
  controllers: [HealthController],
  providers: [SnapshotDecoder],
})
export class AppModule {}
