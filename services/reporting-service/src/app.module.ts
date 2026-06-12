import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { ReportGenerator } from './reports/report.generator.js';
import { ReportStore } from './reports/report.store.js';
import { ReportsController } from './reports/reports.controller.js';

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://elecscan:elecscan@localhost:5432/elecscan';

@Module({
  controllers: [HealthController, ReportsController],
  providers: [DatabaseService, ReportStore, ReportGenerator],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly store: ReportStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.db.connect(DB_URL);
    this.store.setDb(this.db);
  }
}
