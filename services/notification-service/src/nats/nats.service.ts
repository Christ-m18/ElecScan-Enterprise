import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { AckPolicy, DeliverPolicy, type NatsConnection, connect } from 'nats';

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
      this._available = true;
      this.logger.log('NATS JetStream connected');
    } catch (err) {
      this._available = false;
      this.logger.warn(
        `NATS unavailable — HTTP poll active: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async subscribe(
    stream: string,
    subject: string,
    durableName: string,
    handler: (data: unknown) => void,
  ): Promise<void> {
    if (!this.nc || !this._available) return;
    try {
      const jsm = await this.nc.jetstreamManager();
      try {
        await jsm.consumers.info(stream, durableName);
      } catch {
        await jsm.consumers.add(stream, {
          name: durableName,
          durable_name: durableName,
          filter_subject: subject,
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.New,
        });
      }
      const js = this.nc.jetstream();
      const consumer = await js.consumers.get(stream, durableName);
      const msgs = await consumer.consume({ max_messages: 100 });
      void (async () => {
        for await (const msg of msgs) {
          try {
            handler(JSON.parse(new TextDecoder().decode(msg.data)) as unknown);
          } catch {
            /* ignore malformed */
          }
          msg.ack();
        }
      })();
    } catch (err) {
      this.logger.warn(`NATS subscribe error: ${err instanceof Error ? err.message : err}`);
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
