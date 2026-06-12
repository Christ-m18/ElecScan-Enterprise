import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { type NatsConnection, StorageType, connect } from 'nats';

@Injectable()
export class NatsService implements OnApplicationShutdown {
  private readonly logger = new Logger(NatsService.name);
  private nc: NatsConnection | null = null;
  private _available = false;

  get available(): boolean {
    return this._available;
  }

  async connect(url: string): Promise<void> {
    try {
      this.nc = await connect({ servers: url });
      const jsm = await this.nc.jetstreamManager();
      try {
        await jsm.streams.info('TELEMETRY');
      } catch {
        await jsm.streams.add({
          name: 'TELEMETRY',
          subjects: ['telemetry.>'],
          storage: StorageType.Memory,
          max_age: 300_000_000_000,
          max_msgs_per_subject: 1000,
        });
      }
      this._available = true;
      this.logger.log('NATS JetStream connected');
    } catch (err) {
      this._available = false;
      this.logger.warn(
        `NATS unavailable — running without event bus: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async publish(subject: string, data: unknown): Promise<void> {
    if (!this.nc || !this._available) return;
    try {
      const js = this.nc.jetstream();
      await js.publish(subject, new TextEncoder().encode(JSON.stringify(data)));
    } catch (err) {
      this.logger.warn(`NATS publish error: ${err instanceof Error ? err.message : err}`);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.nc?.drain();
    } catch {
      /* ignore */
    }
  }
}
