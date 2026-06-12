import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Header, NotFoundException, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import type { Report } from './report.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ReportGenerator } from './report.generator.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ReportStore } from './report.store.js';

const CreateSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(['realtime', 'energy', 'demand']),
  format: z.enum(['csv', 'json']),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

@Controller()
export class ReportsController {
  constructor(
    private readonly store: ReportStore,
    private readonly generator: ReportGenerator,
  ) {}

  @Post()
  create(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    const report: Report = {
      id: randomUUID(),
      deviceId: dto.deviceId,
      type: dto.type,
      format: dto.format,
      from: dto.from,
      to: dto.to,
      createdAt: new Date().toISOString(),
      status: 'pending',
      errorMessage: undefined,
      content: undefined,
      filename: undefined,
    };
    this.store.set(report);
    void this.generator.generate(report);
    return { id: report.id, status: report.status };
  }

  @Get()
  async list() {
    return (await this.store.getAll()).map(({ content: _, ...meta }) => meta);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    const r = this.store.get(id);
    if (!r) throw new NotFoundException(`Report ${id} not found`);
    const { content: _, ...meta } = r;
    return meta;
  }

  @Get(':id/download')
  @Header('Cache-Control', 'no-store')
  download(@Param('id') id: string) {
    const r = this.store.get(id);
    if (!r) throw new NotFoundException(`Report ${id} not found`);
    if (r.status !== 'ready') throw new NotFoundException(`Report ${id} is not ready yet`);
    return { content: r.content, filename: r.filename, format: r.format };
  }
}
