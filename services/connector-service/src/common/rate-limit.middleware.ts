import type { IncomingMessage, ServerResponse } from 'node:http';
import { Injectable, type NestMiddleware } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly counters = new Map<string, RateLimitEntry>();

  use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ??
      req.socket.remoteAddress ??
      'unknown';

    const now = Date.now();
    let entry = this.counters.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      this.counters.set(ip, entry);
    }
    entry.count++;

    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > MAX_REQUESTS) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 429, message: 'Too Many Requests' }));
      return;
    }
    next();
  }
}
