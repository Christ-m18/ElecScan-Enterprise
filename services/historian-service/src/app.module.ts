import { Module, type OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';
import { HealthController } from './health/health.controller.js';
import { HistorianController } from './historian/historian.controller.js';
import { WriterService } from './writer/writer.service.js';

@Module({
  controllers: [HealthController, HistorianController],
  providers: [DatabaseService, WriterService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly db: DatabaseService) {}

  async onApplicationBootstrap(): Promise<void> {
    const url =
      process.env.TIMESCALE_URL ??
      process.env.DATABASE_URL ??
      'postgresql://elecscan:elecscan@localhost:5432/elecscan';
    await this.db.connect(url);
  }
}
