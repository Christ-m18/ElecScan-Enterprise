import type { FastifyReply, FastifyRequest } from 'fastify';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/refresh',
]);

export async function jwtGuard(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = req.url.split('?')[0] ?? '';
  if (PUBLIC_PATHS.has(path)) return;

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    await reply.status(401).send({ statusCode: 401, message: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  const secret = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret-please-rotate',
  );

  try {
    const { payload } = await jwtVerify(token, secret);
    (req as FastifyRequest & { user: unknown }).user = payload;
  } catch {
    await reply.status(401).send({ statusCode: 401, message: 'Invalid or expired token' });
  }
}
