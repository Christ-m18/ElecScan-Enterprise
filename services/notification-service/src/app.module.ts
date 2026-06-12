import { Module } from '@nestjs/common';
import { AlarmPollService } from './alarm-poll/alarm-poll.service.js';
import { HealthController } from './health/health.controller.js';
import { WebhookController } from './webhook/webhook.controller.js';
import { WebhookStore } from './webhook/webhook.store.js';

@Module({
  controllers: [HealthController, WebhookController],
  providers: [WebhookStore, AlarmPollService],
})
export class AppModule {}
