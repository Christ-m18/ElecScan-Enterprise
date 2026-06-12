import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { ChannelStore } from './notifications/channel.store.js';
import { DispatcherService } from './notifications/dispatcher.service.js';
import { NotificationsController } from './notifications/notifications.controller.js';

@Module({
  controllers: [HealthController, NotificationsController],
  providers: [ChannelStore, DispatcherService],
})
export class AppModule {}
