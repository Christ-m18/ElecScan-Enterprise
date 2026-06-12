import { Controller, Get, Param } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { EventStore } from './event.store.js';

@Controller()
export class DetectionController {
  constructor(private readonly store: EventStore) {}

  @Get('active')
  getActive() {
    return this.store.getActive();
  }

  @Get('active/:deviceId')
  getActiveForDevice(@Param('deviceId') deviceId: string) {
    return this.store.getActiveForDevice(deviceId);
  }

  @Get('history')
  async getHistory() {
    return this.store.getHistory();
  }
}
