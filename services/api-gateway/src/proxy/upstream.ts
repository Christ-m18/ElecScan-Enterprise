const CONNECTOR = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';
const HISTORIAN = process.env.HISTORIAN_SERVICE_URL ?? 'http://127.0.0.1:4005';
const IAM = process.env.IAM_SERVICE_URL ?? 'http://127.0.0.1:4001';
const GEO = process.env.GEO_SERVICE_URL ?? 'http://127.0.0.1:4009';
const ML = process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:4010';
const NOTIFICATIONS = process.env.NOTIFICATION_SERVICE_URL ?? 'http://127.0.0.1:4011';

export function resolveUpstream(downstreamPath: string): string | null {
  const seg = downstreamPath.split('/')[1] ?? '';
  switch (seg) {
    case 'devices':
    case 'alarms':
      return CONNECTOR;
    case 'historian':
      return HISTORIAN;
    case 'auth':
    case 'iam':
      return IAM;
    case 'geo':
    case 'locations':
      return GEO;
    case 'ml':
      return ML;
    case 'notifications':
    case 'webhooks':
      return NOTIFICATIONS;
    default:
      return null;
  }
}
