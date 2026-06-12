import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Header, NotFoundException, Param, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { StorageService } from '../storage/storage.service.js';
import type { Report } from './report.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ReportGenerator } from './report.generator.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ReportStore } from './report.store.js';

const CreateSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(['realtime', 'energy', 'demand']),
  format: z.enum(['csv', 'json', 'pdf']),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

@Controller()
export class ReportsController {
  constructor(
    private readonly store: ReportStore,
    private readonly generator: ReportGenerator,
    private readonly storage: StorageService,
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
  async download(@Param('id') id: string, @Res() reply: FastifyReply) {
    const r = this.store.get(id);
    if (!r) throw new NotFoundException(`Report ${id} not found`);
    if (r.status !== 'ready') throw new NotFoundException(`Report ${id} is not ready yet`);

    if (r.format === 'pdf') {
      // Try MinIO first
      if (r.filename && this.storage.isAvailable()) {
        const buf = await this.storage.getBuffer(r.filename);
        if (buf) {
          const name = r.filename.split('/').pop() ?? `${id}.pdf`;
          await reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="${name}"`)
            .send(buf);
          return;
        }
      }
      // Fall back to in-memory base64
      if (r.content) {
        const buf = Buffer.from(r.content, 'base64');
        await reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="report-${id}.pdf"`)
          .send(buf);
        return;
      }
      throw new NotFoundException(`Report ${id} content unavailable`);
    }

    // CSV / JSON — try MinIO, fall back to in-memory content string
    if (r.filename && this.storage.isAvailable()) {
      const buf = await this.storage.getBuffer(r.filename);
      if (buf) {
        const mime = r.format === 'csv' ? 'text/csv' : 'application/json';
        const name = r.filename.split('/').pop() ?? r.filename;
        await reply
          .header('Content-Type', mime)
          .header('Content-Disposition', `attachment; filename="${name}"`)
          .send(buf);
        return;
      }
    }

    return { content: r.content, filename: r.filename, format: r.format };
  }
}
