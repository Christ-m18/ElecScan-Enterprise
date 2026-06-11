import { randomUUID } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { PollingEngine } from '../polling/polling.engine.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { SnapshotStore } from '../polling/snapshot.store.js';
import type { DeviceConfig } from './device.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { DevicesRepository } from './devices.repository.js';

const CreateDeviceSchema = z.object({
  name: z.string().min(1).max(64),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(502),
  unitId: z.number().int().min(1).max(247).default(1),
});

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly repo: DevicesRepository,
    private readonly engine: PollingEngine,
    private readonly snapshots: SnapshotStore,
  ) {}

  @Post()
  create(@Body() body: unknown) {
    const dto = CreateDeviceSchema.parse(body);
    const device: DeviceConfig = {
      id: randomUUID(),
      name: dto.name,
      host: dto.host,
      port: dto.port,
      unitId: dto.unitId,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    this.repo.add(device);
    this.engine.startDevice(device);
    return device;
  }

  @Get()
  findAll() {
    return this.repo.findAll().map((d) => ({ ...d, status: this.engine.getStatus(d.id) }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const device = this.repo.findById(id);
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return { ...device, status: this.engine.getStatus(id) };
  }

  @Get(':id/snapshot')
  getSnapshot(@Param('id') id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Device ${id} not found`);
    return this.snapshots.getLatest(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Device ${id} not found`);
    this.engine.stopDevice(id);
    this.repo.remove(id);
  }
}
