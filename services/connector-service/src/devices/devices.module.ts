import { Module } from '@nestjs/common';
import { PollingModule } from '../polling/polling.module.js';
import { DevicesController } from './devices.controller.js';
import { DevicesRepository } from './devices.repository.js';

@Module({
  imports: [PollingModule],
  controllers: [DevicesController],
  providers: [DevicesRepository],
})
export class DevicesModule {}
