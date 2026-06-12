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
import type { WebhookEvent } from './webhook.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { WebhookStore } from './webhook.store.js';

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['alarm.raised', 'alarm.acked', 'alarm.cleared'])).min(1) as z.ZodType<
    WebhookEvent[]
  >,
  secret: z.string().optional(),
});

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly store: WebhookStore) {}

  @Post()
  create(@Body() body: unknown) {
    const dto = CreateWebhookSchema.parse(body);
    return this.store.add(dto.url, dto.events, dto.secret);
  }

  @Get()
  list() {
    return this.store.getAll();
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    if (!this.store.remove(id)) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }
  }
}
