import 'reflect-metadata';
import { CommonEnvSchema, HttpEnvSchema, loadEnv } from '@elecscan/shared-config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(CommonEnvSchema.merge(HttpEnvSchema), {
    ...process.env,
    SERVICE_NAME: process.env.SERVICE_NAME ?? 'audit-service',
    PORT: process.env.AUDIT_SERVICE_PORT ?? '4010',
  } as NodeJS.ProcessEnv);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.enableCors();
  app.setGlobalPrefix('audit');
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`[audit-service] listening on ${env.HOST}:${env.PORT}`);
}
void bootstrap();
