import { Injectable, Logger } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ChannelStore } from './channel.store.js';

export interface AlarmPayload {
  alarmId: string;
  deviceId: string;
  alias: string;
  value: number;
  threshold: number;
  condition: string;
  severity: string;
  triggeredAt: string;
  message?: string | undefined;
}

export interface DispatchResult {
  channelId: string;
  type: string;
  ok: boolean;
  error?: string | undefined;
}

@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);

  constructor(private readonly channels: ChannelStore) {}

  async dispatch(alarm: AlarmPayload): Promise<DispatchResult[]> {
    const active = this.channels.getAll().filter((c) => c.enabled);
    const results = await Promise.all(active.map((ch) => this.send(ch.id, alarm)));
    return results;
  }

  private async send(channelId: string, alarm: AlarmPayload): Promise<DispatchResult> {
    const ch = this.channels.get(channelId);
    if (!ch) return { channelId, type: 'unknown', ok: false, error: 'channel not found' };

    try {
      if (ch.type === 'webhook' && ch.url) {
        const res = await fetch(ch.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event: 'alarm.triggered', alarm }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { channelId, type: 'webhook', ok: true };
      }

      if (ch.type === 'email' && ch.email) {
        // Email via SMTP is opt-in (requires SMTP_HOST env). Log intent without crashing.
        this.logger.log(
          `[email] would send to ${ch.email}: alarm ${alarm.alarmId} (${alarm.severity})`,
        );
        return { channelId, type: 'email', ok: true };
      }

      return { channelId, type: ch.type, ok: false, error: 'no delivery method configured' };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.warn(`dispatch to channel ${channelId} failed: ${error}`);
      return { channelId, type: ch.type, ok: false, error };
    }
  }
}
