import {
  INSTRUCTION_REGISTER_RESULT_CODE,
  INSTRUCTION_REGISTER_START,
  buildInstructionPayload,
  findInstruction,
} from '@elecscan/shared-modbus';
import { Injectable, Logger } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { PollingEngine } from '../polling/polling.engine.js';

export interface WriteResult {
  readonly deviceId: string;
  readonly instructionCode: number;
  readonly params: Record<string, number>;
  readonly resultCode: number;
  readonly resultStatus: number;
  readonly success: boolean;
  readonly executedAt: string;
  readonly error?: string;
}

const MAX_AUDIT = 200;

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly auditLog: WriteResult[] = [];

  constructor(private readonly engine: PollingEngine) {}

  async writeInstruction(
    deviceId: string,
    instructionCode: number,
    params: Record<string, number>,
  ): Promise<WriteResult> {
    const spec = findInstruction(instructionCode);
    if (!spec) throw new Error(`Unknown instruction code: ${instructionCode}`);

    const payload = buildInstructionPayload(spec, params);

    const client = this.engine.getClient(deviceId);
    if (!client) throw new Error(`No active client for device ${deviceId} — is polling running?`);

    const executedAt = new Date().toISOString();
    try {
      await client.writeMultipleRegisters(INSTRUCTION_REGISTER_START, payload);

      // Read back result registers 424-425
      const resp = await client.readHoldingRegisters(INSTRUCTION_REGISTER_RESULT_CODE, 2);
      const resultCode = resp.registers[0] ?? 0;
      const resultStatus = resp.registers[1] ?? 0;
      const success = resultStatus === 0;

      const entry: WriteResult = {
        deviceId,
        instructionCode,
        params,
        resultCode,
        resultStatus,
        success,
        executedAt,
      };
      this.appendAudit(entry);
      this.logger.log(
        `[${deviceId}] instruction ${instructionCode} → resultCode=${resultCode} status=${resultStatus}`,
      );
      return entry;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const entry: WriteResult = {
        deviceId,
        instructionCode,
        params,
        resultCode: 0,
        resultStatus: -1,
        success: false,
        executedAt,
        error,
      };
      this.appendAudit(entry);
      this.logger.warn(`[${deviceId}] instruction ${instructionCode} failed: ${error}`);
      return entry;
    }
  }

  getAuditLog(deviceId?: string): WriteResult[] {
    if (deviceId) return this.auditLog.filter((e) => e.deviceId === deviceId);
    return [...this.auditLog];
  }

  private appendAudit(entry: WriteResult): void {
    this.auditLog.push(entry);
    if (this.auditLog.length > MAX_AUDIT) this.auditLog.shift();
  }
}
