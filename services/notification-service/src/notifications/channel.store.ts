import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export type ChannelType = 'webhook' | 'email';

export interface NotificationChannel {
  id: string;
  type: ChannelType;
  name: string;
  url?: string;
  email?: string;
  enabled: boolean;
  createdAt: string;
}

@Injectable()
export class ChannelStore {
  private readonly channels = new Map<string, NotificationChannel>();

  add(input: {
    type: ChannelType;
    name: string;
    url?: string;
    email?: string;
  }): NotificationChannel {
    const ch: NotificationChannel = {
      id: randomUUID(),
      ...input,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    this.channels.set(ch.id, ch);
    return ch;
  }

  get(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  getAll(): NotificationChannel[] {
    return [...this.channels.values()];
  }

  setEnabled(id: string, enabled: boolean): boolean {
    const ch = this.channels.get(id);
    if (!ch) return false;
    ch.enabled = enabled;
    return true;
  }

  remove(id: string): boolean {
    return this.channels.delete(id);
  }
}
