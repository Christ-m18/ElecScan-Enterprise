import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { WebhookEvent, WebhookSubscription } from './webhook.entity.js';

@Injectable()
export class WebhookStore {
  private readonly hooks = new Map<string, WebhookSubscription>();

  add(url: string, events: WebhookEvent[], secret: string | undefined): WebhookSubscription {
    const hook: WebhookSubscription = {
      id: randomUUID(),
      url,
      events,
      secret,
      createdAt: new Date().toISOString(),
    };
    this.hooks.set(hook.id, hook);
    return hook;
  }

  remove(id: string): boolean {
    return this.hooks.delete(id);
  }

  getAll(): WebhookSubscription[] {
    return Array.from(this.hooks.values());
  }

  getByEvent(event: WebhookEvent): WebhookSubscription[] {
    return this.getAll().filter((h) => h.events.includes(event));
  }
}
