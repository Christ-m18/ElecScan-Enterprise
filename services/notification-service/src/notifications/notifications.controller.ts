import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ChannelStore } from './channel.store.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { DispatcherService } from './dispatcher.service.js';
import type { DispatchResult } from './dispatcher.service.js';

const CreateChannelSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('webhook'), name: z.string().min(1), url: z.string().url() }),
  z.object({ type: z.literal('email'), name: z.string().min(1), email: z.string().email() }),
]);

const DispatchSchema = z.object({
  alarmId: z.string(),
  deviceId: z.string(),
  alias: z.string(),
  value: z.number(),
  threshold: z.number(),
  condition: z.string(),
  severity: z.string(),
  triggeredAt: z.string(),
  message: z.string().optional(),
});

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly channels: ChannelStore,
    private readonly dispatcher: DispatcherService,
  ) {}

  @Post('channels')
  @HttpCode(201)
  addChannel(@Body() body: unknown) {
    const dto = CreateChannelSchema.parse(body);
    return this.channels.add(dto);
  }

  @Get('channels')
  listChannels() {
    return this.channels.getAll();
  }

  @Patch('channels/:id/toggle')
  toggleChannel(@Param('id') id: string, @Body() body: unknown) {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(body);
    const ok = this.channels.setEnabled(id, enabled);
    if (!ok) throw new NotFoundException(`Channel ${id} not found`);
    return { id, enabled };
  }

  @Delete('channels/:id')
  @HttpCode(204)
  removeChannel(@Param('id') id: string) {
    if (!this.channels.remove(id)) throw new NotFoundException(`Channel ${id} not found`);
  }

  @Post('dispatch')
  async dispatch(@Body() body: unknown): Promise<DispatchResult[]> {
    const dto = DispatchSchema.parse(body);
    const alarm = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as unknown as Parameters<DispatcherService['dispatch']>[0];
    return this.dispatcher.dispatch(alarm);
  }
}
