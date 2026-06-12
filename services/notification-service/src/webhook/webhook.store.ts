import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { DatabaseService } from '../database/database.service.js';
import type { WebhookEvent, WebhookSubscription } from './webhook.entity.js';

@Injectable()
export class WebhookStore {
  private readonly logger = new Logger(WebhookStore.name);
  private db: DatabaseService | null = null;
  private readonly hooks = new Map<string, WebhookSubscription>();

  setDb(db: DatabaseService): void {
    this.db = db;
  }

  async loadFromDb(): Promise<void> {
    if (!this.db?.available) return;
    try {
      const { rows } = await this.db.query<{
        id: string;
        url: string;
        events: string[];
        secret: string | null;
        created_at: Date;
      }>('SELECT id, url, events, secret, created_at FROM webhook_subscription');
      for (const r of rows) {
        this.hooks.set(r.id, {
          id: r.id,
          url: r.url,
          events: r.events as WebhookEvent[],
          secret: r.secret ?? undefined,
          createdAt: new Date(r.created_at).toISOString(),
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to load webhooks from DB: ${e instanceof Error ? e.message : e}`);
    }
  }

  async add(
    url: string,
    events: WebhookEvent[],
    secret: string | undefined,
  ): Promise<WebhookSubscription> {
    const hook: WebhookSubscription = {
      id: randomUUID(),
      url,
      events,
      secret,
      createdAt: new Date().toISOString(),
    };
    this.hooks.set(hook.id, hook);
    if (this.db?.available) {
      await this.db
        .query(
          `INSERT INTO webhook_subscription(id,url,events,secret,created_at)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [hook.id, hook.url, hook.events, hook.secret ?? null, hook.createdAt],
        )
        .catch((e: Error) => this.logger.warn(`DB insert webhook: ${e.message}`));
    }
    return hook;
  }

  async remove(id: string): Promise<boolean> {
    const existed = this.hooks.delete(id);
    if (existed && this.db?.available) {
      await this.db
        .query('DELETE FROM webhook_subscription WHERE id=$1', [id])
        .catch((e: Error) => this.logger.warn(`DB delete webhook: ${e.message}`));
    }
    return existed;
  }

  getAll(): WebhookSubscription[] {
    return Array.from(this.hooks.values());
  }

  getByEvent(event: WebhookEvent): WebhookSubscription[] {
    return this.getAll().filter((h) => h.events.includes(event));
  }
}
