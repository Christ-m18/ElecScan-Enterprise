import 'reflect-metadata';
import { CommonEnvSchema, HttpEnvSchema, loadEnv } from '@elecscan/shared-config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(CommonEnvSchema.merge(HttpEnvSchema), {
    ...process.env,
    SERVICE_NAME: process.env.SERVICE_NAME ?? 'connector-service',
    PORT: process.env.CONNECTOR_SERVICE_PORT ?? '4003',
  } as NodeJS.ProcessEnv);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.enableCors();
  app.setGlobalPrefix('connector');
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`[connector-service] listening on ${env.HOST}:${env.PORT}`);
}

void bootstrap();
