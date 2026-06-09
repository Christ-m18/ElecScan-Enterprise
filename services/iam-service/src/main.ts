import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { CommonEnvSchema, HttpEnvSchema, JwtEnvSchema, loadEnv } from '@elecscan/shared-config';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(CommonEnvSchema.merge(HttpEnvSchema).merge(JwtEnvSchema), {
    ...process.env,
    SERVICE_NAME: process.env['SERVICE_NAME'] ?? 'iam-service',
    PORT: process.env['IAM_SERVICE_PORT'] ?? '4001',
  } as NodeJS.ProcessEnv);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.setGlobalPrefix('iam');
  await app.listen({ port: env.PORT, host: env.HOST });
  // eslint-disable-next-line no-console
  console.log(`[iam-service] listening on ${env.HOST}:${env.PORT}`);
}

void bootstrap();
