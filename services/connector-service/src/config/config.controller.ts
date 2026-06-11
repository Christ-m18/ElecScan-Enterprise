import { INSTRUCTIONS, findInstruction } from '@elecscan/shared-modbus';
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
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { PendingApprovalStore } from './pending-approval.store.js';

const WriteInstructionSchema = z.object({
  instructionCode: z.number().int().positive(),
  params: z.record(z.string(), z.number()),
  requestedBy: z.string().min(1).default('operator'),
  justification: z.string().optional(),
  approvalId: z.string().uuid().optional(),
});

const ApproveSchema = z.object({
  approvedBy: z.string().min(1).default('approver'),
});

@Controller('devices')
export class ConfigController {
  constructor(
    private readonly repo: DevicesRepository,
    private readonly config: ConfigService,
    private readonly approvals: PendingApprovalStore,
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

    const spec = findInstruction(dto.data.instructionCode);
    if (!spec)
      throw new BadRequestException(`Unknown instruction code ${dto.data.instructionCode}`);

    // 4-eyes: high-danger commands need an approved pendingApproval
    if (spec.danger === 'high') {
      if (!dto.data.approvalId) {
        const pending = this.approvals.create(
          id,
          dto.data.instructionCode,
          dto.data.params,
          dto.data.requestedBy,
          dto.data.justification ?? '',
        );
        return {
          status: 'pending_approval',
          approvalId: pending.id,
          message: `Instruction ${spec.label} requires 4-eyes approval. Share approvalId with a second operator.`,
          expiresAt: pending.expiresAt,
        };
      }
      const approval = this.approvals.get(dto.data.approvalId);
      if (!approval) throw new BadRequestException('Approval not found or expired');
      if (!approval.approvedBy) throw new BadRequestException('Approval not yet confirmed');
      if (approval.approvedBy === dto.data.requestedBy) {
        throw new BadRequestException('Approver must be different from requester (4-eyes)');
      }
      this.approvals.consume(dto.data.approvalId);
    }

    return this.config.writeInstruction(id, dto.data.instructionCode, dto.data.params);
  }

  @Post('approvals/:approvalId/approve')
  approveInstruction(@Param('approvalId') approvalId: string, @Body() body: unknown) {
    const dto = ApproveSchema.safeParse(body);
    if (!dto.success) throw new BadRequestException(dto.error.format());
    const approval = this.approvals.approve(approvalId, dto.data.approvedBy);
    if (!approval) throw new NotFoundException(`Approval ${approvalId} not found or expired`);
    return approval;
  }

  @Get('approvals/pending')
  listPendingApprovals() {
    return this.approvals.listPending();
  }

  @Get(':id/config/audit')
  getAudit(@Param('id') id: string, @Query('all') all?: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Device ${id} not found`);
    return this.config.getAuditLog(all === 'true' ? undefined : id);
  }
}
