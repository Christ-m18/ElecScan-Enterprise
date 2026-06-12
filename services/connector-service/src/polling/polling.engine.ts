import { ModbusTcpClient, POLLING_BLOCKS } from '@elecscan/shared-modbus';
import type { PollingBlock } from '@elecscan/shared-modbus';
import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { SnapshotDecoder } from '../application/snapshot-decoder.js';
import type { DeviceConfig, DeviceStatus } from '../devices/device.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { NatsService } from '../nats/nats.service.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { SnapshotStore } from './snapshot.store.js';

const NATS_SUBJECT = 'telemetry.normalized.v1';

@Injectable()
export class PollingEngine implements OnApplicationShutdown {
  private readonly logger = new Logger(PollingEngine.name);
  private readonly clients = new Map<string, ModbusTcpClient>();
  private readonly timers = new Map<string, NodeJS.Timeout[]>();
  private readonly statusMap = new Map<string, DeviceStatus>();

  constructor(
    private readonly decoder: SnapshotDecoder,
    private readonly snapshots: SnapshotStore,
    private readonly nats: NatsService,
  ) {}

  onApplicationShutdown(): void {
    for (const id of Array.from(this.clients.keys())) {
      this.stopDevice(id);
    }
  }

  startDevice(device: DeviceConfig): void {
    if (this.clients.has(device.id)) return;

    const client = new ModbusTcpClient({
      host: device.host,
      port: device.port,
      unitId: device.unitId,
    });
    this.clients.set(device.id, client);
    this.statusMap.set(device.id, {
      connected: false,
      lastPollAt: null,
      errorCount: 0,
      lastError: null,
    });

    const deviceTimers: NodeJS.Timeout[] = [];
    for (const block of POLLING_BLOCKS) {
      void this.pollBlock(device.id, client, block);
      const t = setInterval(
        () => void this.pollBlock(device.id, client, block),
        block.defaultPeriodMs,
      );
      deviceTimers.push(t);
    }
    this.timers.set(device.id, deviceTimers);
    this.logger.log(`[${device.id}] started polling ${device.host}:${device.port}`);
  }

  stopDevice(id: string): void {
    for (const t of this.timers.get(id) ?? []) clearInterval(t);
    this.timers.delete(id);
    void this.clients.get(id)?.disconnect();
    this.clients.delete(id);
    this.snapshots.clear(id);
    this.statusMap.delete(id);
    this.logger.log(`[${id}] polling stopped`);
  }

  getStatus(id: string): DeviceStatus {
    return (
      this.statusMap.get(id) ?? {
        connected: false,
        lastPollAt: null,
        errorCount: 0,
        lastError: null,
      }
    );
  }

  getClient(id: string): ModbusTcpClient | undefined {
    return this.clients.get(id);
  }

  private async pollBlock(
    deviceId: string,
    client: ModbusTcpClient,
    block: PollingBlock,
  ): Promise<void> {
    try {
      const response = await ModbusTcpClient.withBackoff(
        () => client.readHoldingRegisters(block.startAddress, block.registerCount),
        { retries: 2, baseMs: 500 },
      );
      const entries = this.decoder.decodeBlock(block, response.registers);
      this.snapshots.update(deviceId, entries);
      this.setStatus(deviceId, true, null);
      void this.publishSnapshot(deviceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setStatus(deviceId, false, msg);
      this.logger.warn(`[${deviceId}] block ${block.id}: ${msg}`);
    }
  }

  private async publishSnapshot(deviceId: string): Promise<void> {
    const latest = this.snapshots.getLatest(deviceId);
    const values: Record<string, number> = {};
    for (const [alias, sv] of Object.entries(latest.values)) {
      values[alias] = typeof sv.value === 'bigint' ? Number(sv.value) : sv.value;
    }
    await this.nats.publish(NATS_SUBJECT, { deviceId, ts: latest.updatedAt, values });
  }

  private setStatus(id: string, connected: boolean, error: string | null): void {
    const prev = this.statusMap.get(id);
    this.statusMap.set(id, {
      connected,
      lastPollAt: connected ? new Date().toISOString() : (prev?.lastPollAt ?? null),
      errorCount: error ? (prev?.errorCount ?? 0) + 1 : 0,
      lastError: error,
    });
  }
}
