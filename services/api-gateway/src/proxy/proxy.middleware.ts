import type { IncomingMessage, ServerResponse } from 'node:http';
import * as http from 'node:http';
import * as https from 'node:https';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { resolveUpstream } from './upstream.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
);

const PUBLIC_PREFIXES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/iam/auth/login',
  '/api/iam/auth/signup',
];

function reject(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ statusCode: status, message }));
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  async use(req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> {
    const rawUrl = req.url ?? '/';

    if (rawUrl === '/api/health' || rawUrl.startsWith('/api/health?')) {
      next();
      return;
    }

    const isPublic = PUBLIC_PREFIXES.some((p) => rawUrl.startsWith(p));
    if (!isPublic) {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        reject(res, 401, 'Unauthorized');
        return;
      }
      try {
        await jwtVerify(auth.slice(7), JWT_SECRET);
      } catch {
        reject(res, 401, 'Invalid or expired token');
        return;
      }
    }

    const downstreamPath = rawUrl.replace(/^\/api/, '') || '/';
    const upstreamBase = resolveUpstream(downstreamPath);

    if (!upstreamBase) {
      reject(res, 502, `No upstream for ${downstreamPath}`);
      return;
    }

    const upstreamUrl = new URL(upstreamBase);
    const isHttps = upstreamUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const port = upstreamUrl.port ? Number.parseInt(upstreamUrl.port, 10) : isHttps ? 443 : 80;

    const forwardHeaders: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (k !== 'host' && v !== undefined) {
        forwardHeaders[k] = v as string | string[];
      }
    }
    forwardHeaders['x-forwarded-for'] =
      (req.socket.remoteAddress ?? '') +
      (req.headers['x-forwarded-for'] ? `, ${req.headers['x-forwarded-for']}` : '');

    const proxyReq = client.request(
      {
        hostname: upstreamUrl.hostname,
        port,
        path: downstreamPath,
        method: req.method,
        headers: forwardHeaders,
      },
      (proxyRes) => {
        const { 'transfer-encoding': _te, ...safeHeaders } = proxyRes.headers;
        res.writeHead(proxyRes.statusCode ?? 200, safeHeaders);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        reject(res, 502, `Upstream unavailable: ${err.message}`);
      }
    });

    req.pipe(proxyReq);
  }
}
