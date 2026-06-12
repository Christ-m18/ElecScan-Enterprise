import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { IngestService } from './ingest.service.js';

@Controller()
export class IngestController {
  constructor(private readonly svc: IngestService) {}

  @Get('snapshots')
  listSnapshots() {
    return this.svc.getAll();
  }

  @Get('snapshots/:deviceId')
  getSnapshot(@Param('deviceId') deviceId: string) {
    const snap = this.svc.getOne(deviceId);
    if (!snap) throw new NotFoundException(`No normalized snapshot for device ${deviceId}`);
    return snap;
  }

  @Get('status')
  getStatus() {
    return this.svc.getStatus();
  }

  @Get('validation/errors')
  getErrors() {
    return this.svc.getRecentErrors();
  }
}
