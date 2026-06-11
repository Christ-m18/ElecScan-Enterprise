import { INSTRUCTIONS } from '@elecscan/shared-modbus';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { DevicesRepository } from '../devices/devices.repository.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ConfigService } from './config.service.js';

const WriteInstructionSchema = z.object({
  instructionCode: z.number().int().positive(),
  params: z.record(z.string(), z.number()),
});

@Controller('devices')
export class ConfigController {
  constructor(
    private readonly repo: DevicesRepository,
    private readonly config: ConfigService,
  ) {}

  @Get('instructions')
  listInstructions() {
    return INSTRUCTIONS;
  }

  @Post(':id/config')
  async writeInstruction(@Param('id') id: string, @Body() body: unknown) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Device ${id} not found`);
    const dto = WriteInstructionSchema.safeParse(body);
    if (!dto.success) throw new BadRequestException(dto.error.format());
    return this.config.writeInstruction(id, dto.data.instructionCode, dto.data.params);
  }

  @Get(':id/config/audit')
  getAudit(@Param('id') id: string, @Query('all') all?: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Device ${id} not found`);
    return this.config.getAuditLog(all === 'true' ? undefined : id);
  }
}
