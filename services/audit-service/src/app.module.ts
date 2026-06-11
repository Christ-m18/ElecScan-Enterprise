import { Module } from '@nestjs/common';
import { HashChainService } from './chain/hash-chain.service.js';
import { HealthController } from './health/health.controller.js';

@Module({ controllers: [HealthController], providers: [HashChainService] })
export class AppModule {}
