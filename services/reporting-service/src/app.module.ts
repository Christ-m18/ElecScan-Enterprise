import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { ReportGenerator } from './reports/report.generator.js';
import { ReportStore } from './reports/report.store.js';
import { ReportsController } from './reports/reports.controller.js';

@Module({
  controllers: [HealthController, ReportsController],
  providers: [ReportStore, ReportGenerator],
})
export class AppModule {}
