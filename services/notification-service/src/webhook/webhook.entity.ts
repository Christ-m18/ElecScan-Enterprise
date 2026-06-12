export type WebhookEvent = 'alarm.raised' | 'alarm.acked' | 'alarm.cleared';

export interface WebhookSubscription {
  readonly id: string;
  readonly url: string;
  readonly events: WebhookEvent[];
  readonly secret: string | undefined;
  readonly createdAt: string;
}
