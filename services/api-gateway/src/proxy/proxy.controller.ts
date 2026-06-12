import { All, Controller, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

const UPSTREAM: Record<string, string> = {
  auth: process.env.IAM_SERVICE_URL ?? 'http://127.0.0.1:4001',
  connector: process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003',
  historian: process.env.HISTORIAN_SERVICE_URL ?? 'http://127.0.0.1:4005',
  geo: process.env.GEO_SERVICE_URL ?? 'http://127.0.0.1:4009',
  ml: process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:4010',
  audit: process.env.AUDIT_SERVICE_URL ?? 'http://127.0.0.1:4007',
  notifications: process.env.NOTIFICATION_SERVICE_URL ?? 'http://127.0.0.1:4008',
};

@Controller()
export class ProxyController {
  @All('auth/*')
  proxyIam(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('auth', req, reply);
  }

  @All('connector/*')
  proxyConnector(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('connector', req, reply);
  }

  @All('historian/*')
  proxyHistorian(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('historian', req, reply);
  }

  @All('geo/*')
  proxyGeo(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('geo', req, reply);
  }

  @All('ml/*')
  proxyMl(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('ml', req, reply);
  }

  @All('audit/*')
  proxyAudit(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('audit', req, reply);
  }

  @All('notifications/*')
  proxyNotifications(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.forward('notifications', req, reply);
  }

  private async forward(service: string, req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const base = UPSTREAM[service];
    if (!base) {
      await reply.status(502).send({ statusCode: 502, message: 'Upstream not configured' });
      return;
    }

    // Strip the /api prefix that NestJS global prefix adds, then strip the service segment
    const rawUrl = req.url; // e.g. /api/connector/devices
    const withoutApi = rawUrl.replace(/^\/api/, '');
    const withoutService = withoutApi.replace(/^\/[^/]+/, '');
    const targetPath = withoutService || '/';

    const targetUrl = `${base}${targetPath}`;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (k === 'host') continue;
      if (typeof v === 'string') headers[k] = v;
      else if (Array.isArray(v)) headers[k] = v.join(', ');
    }

    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    try {
      const init: RequestInit = { method: req.method, headers };
      if (body !== undefined) init.body = body;
      const upstream = await fetch(targetUrl, init);

      const contentType = upstream.headers.get('content-type') ?? 'application/json';
      const text = await upstream.text();

      await reply.status(upstream.status).header('content-type', contentType).send(text);
    } catch (err) {
      await reply.status(502).send({
        statusCode: 502,
        message: `Upstream ${service} unavailable`,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
