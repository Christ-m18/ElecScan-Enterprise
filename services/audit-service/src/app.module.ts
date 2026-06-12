import { Module } from '@nestjs/common';
import { AuditController } from './audit/audit.controller.js';
import { AuditStore } from './chain/audit.store.js';
import { HashChainService } from './chain/hash-chain.service.js';
import { HealthController } from './health/health.controller.js';

@Module({
  controllers: [HealthController, AuditController],
  providers: [HashChainService, AuditStore],
})
export class AppModule {}
