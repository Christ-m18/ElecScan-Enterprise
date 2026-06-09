import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { HashChainService } from './chain/hash-chain.service.js';

@Module({ controllers: [HealthController], providers: [HashChainService] })
export class AppModule {}
