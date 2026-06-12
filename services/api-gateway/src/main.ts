import 'reflect-metadata';
import { CommonEnvSchema, HttpEnvSchema, loadEnv } from '@elecscan/shared-config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(CommonEnvSchema.merge(HttpEnvSchema), {
    ...process.env,
    SERVICE_NAME: process.env.SERVICE_NAME ?? 'api-gateway',
    PORT: process.env.API_GATEWAY_PORT ?? '4000',
  } as NodeJS.ProcessEnv);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
  );

  app.enableCors();
  app.setGlobalPrefix('api');

  const fastify = app.getHttpAdapter().getInstance();
  const { jwtGuard } = await import('./auth/jwt.guard.js');
  fastify.addHook('preHandler', jwtGuard);

  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`[api-gateway] listening on ${env.HOST}:${env.PORT}`);
}

void bootstrap();
