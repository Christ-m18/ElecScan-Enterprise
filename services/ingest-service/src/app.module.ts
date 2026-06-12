import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { IngestController } from './ingest/ingest.controller.js';
import { IngestService } from './ingest/ingest.service.js';

@Module({
  controllers: [HealthController, IngestController],
  providers: [IngestService],
})
export class AppModule {}
