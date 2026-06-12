import { createHmac } from 'node:crypto';
import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { WebhookStore } from '../webhook/webhook.store.js';

const CONNECTOR_URL = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';
const POLL_MS = 10_000;

interface ActiveAlarm {
  id: string;
  ruleName: string;
  deviceId: string;
  alias: string;
  severity: string;
  value: number;
  threshold: number;
  condition: string;
  raisedAt: string;
  ackedAt: string | null;
}

@Injectable()
export class AlarmPollService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly seenRaised = new Set<string>();
  private readonly seenAcked = new Set<string>();

  constructor(private readonly webhooks: WebhookStore) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    try {
      const r = await fetch(`${CONNECTOR_URL}/alarms/active`);
      if (!r.ok) return;
      const alarms = (await r.json()) as ActiveAlarm[];

      for (const alarm of alarms) {
        if (!this.seenRaised.has(alarm.id)) {
          this.seenRaised.add(alarm.id);
          await this.dispatch('alarm.raised', alarm);
        }
        if (alarm.ackedAt && !this.seenAcked.has(alarm.id)) {
          this.seenAcked.add(alarm.id);
          await this.dispatch('alarm.acked', alarm);
        }
      }
    } catch {
      // connector unavailable — silent
    }
  }

  private async dispatch(event: 'alarm.raised' | 'alarm.acked', alarm: ActiveAlarm): Promise<void> {
    const subs = this.webhooks.getByEvent(event);
    if (!subs.length) return;

    const payload = JSON.stringify({ event, timestamp: new Date().toISOString(), alarm });

    await Promise.allSettled(
      subs.map(async (sub) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sub.secret) {
          const sig = createHmac('sha256', sub.secret).update(payload).digest('hex');
          headers['X-ElecScan-Signature'] = `sha256=${sig}`;
        }
        try {
          await fetch(sub.url, { method: 'POST', headers, body: payload });
        } catch {
          // webhook endpoint unreachable — silent
        }
      }),
    );
  }
}
