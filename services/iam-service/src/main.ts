import 'reflect-metadata';
import { CommonEnvSchema, HttpEnvSchema, JwtEnvSchema, loadEnv } from '@elecscan/shared-config';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppModule } from './app.module.js';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    this.logger.error(
      `[${request.method}] ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    void reply
      .status(status)
      .send(
        exception instanceof HttpException
          ? exception.getResponse()
          : { statusCode: 500, message: 'Internal server error' },
      );
  }
}

async function bootstrap(): Promise<void> {
  const env = loadEnv(CommonEnvSchema.merge(HttpEnvSchema).merge(JwtEnvSchema), {
    ...process.env,
    SERVICE_NAME: process.env.SERVICE_NAME ?? 'iam-service',
    PORT: process.env.IAM_SERVICE_PORT ?? '4001',
  } as NodeJS.ProcessEnv);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('iam');
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`[iam-service] listening on ${env.HOST}:${env.PORT}`);
}

void bootstrap();
